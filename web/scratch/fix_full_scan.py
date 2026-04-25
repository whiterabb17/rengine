from scanEngine.models import EngineType
import yaml

e = EngineType.objects.filter(engine_name='Full Scan').first()
if e:
    # Remove the invalid line
    config_lines = e.yaml_configuration.split('\n')
    new_lines = [line for line in config_lines if '["Cookie: Test"]' not in line]
    
    # Check if firewall_vpn_scan is missing and add it
    if 'firewall_vpn_scan' not in e.tasks:
        # Find where to insert, e.g. before screenshot or at the end
        new_lines.append('firewall_vpn_scan: {}')
    
    e.yaml_configuration = '\n'.join(new_lines)
    e.save()
    print('Successfully fixed Full Scan engine in database.')
else:
    print('Full Scan engine not found.')
