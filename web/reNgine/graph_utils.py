from neo4j import GraphDatabase
import logging
from django.conf import settings
from startScan.models import Subdomain, EndPoint
from targetApp.models import Domain

logger = logging.getLogger(__name__)

class Neo4jManager:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.user = settings.NEO4J_USER
        self.password = settings.NEO4J_PASSWORD
        self.driver = None
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def sync_scan_results(self, scan_history_id):
        """Syncs scan results from PostgreSQL to Neo4j."""
        if not self.driver:
            return

        with self.driver.session() as session:
            # Sync Domain
            subdomains = Subdomain.objects.filter(scan_history_id=scan_history_id)
            for sub in subdomains:
                domain_name = sub.target_domain.name
                subdomain_name = sub.name
                ip_address = sub.ip_addresses if hasattr(sub, 'ip_addresses') else None
                
                session.execute_write(self._merge_assets, domain_name, subdomain_name, ip_address)

            # Sync Endpoints and Parameters
            endpoints = EndPoint.objects.filter(scan_history_id=scan_history_id)
            for endpoint in endpoints:
                session.execute_write(self._merge_endpoints, endpoint.subdomain.name, endpoint.http_url)
                
                # Sync Parameters
                parameters = endpoint.parameters.all()
                for param in parameters:
                    session.execute_write(self._merge_parameters, endpoint.http_url, param.name, param.type)

    @staticmethod
    def _merge_assets(tx, domain_name, subdomain_name, ip_address):
        # Create Domain
        tx.run("MERGE (d:Domain {name: $name})", name=domain_name)
        
        # Create Subdomain and link to Domain
        tx.run("""
            MERGE (s:Subdomain {name: $sub_name})
            WITH s
            MATCH (d:Domain {name: $dom_name})
            MERGE (d)-[:HAS_SUBDOMAIN]->(s)
        """, sub_name=subdomain_name, dom_name=domain_name)
        
        # If IP address exists, link it
        if ip_address:
            # Handle multiple IPs if comma separated
            ips = [ip.strip() for ip in str(ip_address).split(',')]
            for ip in ips:
                tx.run("""
                    MERGE (i:IPAddress {address: $ip})
                    WITH i
                    MATCH (s:Subdomain {name: $sub_name})
                    MERGE (s)-[:RESOLVES_TO]->(i)
                """, ip=ip, sub_name=subdomain_name)

    @staticmethod
    def _merge_endpoints(tx, subdomain_name, http_url):
        tx.run("""
            MERGE (e:Endpoint {url: $url})
            WITH e
            MATCH (s:Subdomain {name: $sub_name})
            MERGE (s)-[:HAS_ENDPOINT]->(e)
        """, url=http_url, sub_name=subdomain_name)

    @staticmethod
    def _merge_parameters(tx, endpoint_url, param_name, param_type):
        tx.run("""
            MERGE (p:Parameter {name: $name, type: $type})
            WITH p
            MATCH (e:Endpoint {url: $url})
            MERGE (e)-[:HAS_PARAMETER]->(p)
        """, name=param_name, type=param_type, url=endpoint_url)

    def sync_all_scans(self):
        """Syncs all scan results from PostgreSQL to Neo4j."""
        from startScan.models import ScanHistory
        scans = ScanHistory.objects.all()
        total_scans = scans.count()
        logger.info(f"Starting global graph synchronization for {total_scans} scans.")
        
        for index, scan in enumerate(scans, 1):
            logger.info(f"[{index}/{total_scans}] Syncing scan: {scan.domain.name} (ID: {scan.id})")
            try:
                self.sync_scan_results(scan.id)
            except Exception as e:
                logger.error(f"Failed to sync scan {scan.id}: {e}")
        
        logger.info("Global graph synchronization completed successfully.")

    def get_cytoscape_json(self, scan_history_id):
        """Returns graph data in Cytoscape format."""
        if not self.driver:
            return {"nodes": [], "edges": []}

        nodes = []
        edges = []
        
        # Color mapping for node types
        color_map = {
            'Domain': '#3b82f6',      # Blue
            'Subdomain': '#10b981',   # Green
            'IPAddress': '#f59e0b',   # Orange
            'Vulnerability': '#ef4444', # Red
            'Endpoint': '#8b5cf6',    # Purple
            'Parameter': '#ec4899'    # Pink
        }

        with self.driver.session() as session:
            # Fetch nodes and edges
            result = session.run("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 2000")
            
            seen_nodes = set()
            for record in result:
                for node_key in ['n', 'm']:
                    node = record[node_key]
                    node_id = str(node.id)
                    if node_id not in seen_nodes:
                        label = node.get('name') or node.get('address') or node_id
                        node_type = list(node.labels)[0] if node.labels else 'Unknown'
                        nodes.append({
                            "data": {
                                "id": node_id,
                                "label": label,
                                "type": node_type,
                                "color": color_map.get(node_type, '#94a3b8')
                            }
                        })
                        seen_nodes.add(node_id)
                
                edges.append({
                    "data": {
                        "source": str(record['n'].id),
                        "target": str(record['m'].id),
                        "label": record['r'].type
                    }
                })
        
        return {"nodes": nodes, "edges": edges}
