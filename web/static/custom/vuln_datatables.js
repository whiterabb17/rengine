const vuln_datatable_columns = [
	{'data': 'id'},
	{'data': 'source'},
	{'data': 'type'},

	{'data': 'name'},
	{'data': 'cvss_metrics'},
	{'data': 'tags'},
	{'data': 'hackerone_report_id'},

	{'data': 'severity'},
	{'data': 'cvss_score'},
	{'data': 'cve_ids'},
	{'data': 'cwe_ids'},
	{'data': 'http_url'},

	{'data': 'description'},
	{'data': 'references'},

	{'data': 'discovered_date'},
	{'data': 'exploit_url'},
	{'data': 'validation_status'},

	{'data': 'open_status'},

	{'data': null}, // 18

	{'data': 'extracted_results'},
	{'data': 'curl_command'},
	{'data': 'matcher_name'},
];

const vuln_datatable_page_length = 50;
const vuln_datatable_length_menu = [[50, 100, 500, 1000, -1], [50, 100, 500, 1000, 'All']];


function vulnerability_datatable_col_visibility(table){
	const hidden_cols = [
		'type', 'cvss_metrics', 'tags', 'hackerone_report_id', 
		'cve_ids', 'cwe_ids', 'description', 'references', 
		'discovered_date', 'exploit_url', 'validation_status',
		'extracted_results', 'curl_command', 'matcher_name'
	];
	
	hidden_cols.forEach(col => {
		let idx = get_datatable_col_index(col, vuln_datatable_columns);
		if (idx !== -1) table.column(idx).visible(false);
	});
	
	// Ensure essential columns are visible
	const visible_cols = ['source', 'severity', 'cvss_score', 'http_url', 'open_status'];
	visible_cols.forEach(col => {
		let idx = get_datatable_col_index(col, vuln_datatable_columns);
		if (idx !== -1) {
			const checkboxId = `#vuln_${col === 'open_status' ? 'status' : col === 'http_url' ? 'vulnerable_url' : col}_checkbox`;
			if($(checkboxId).length === 0 || $(checkboxId).is(":checked")){
				table.column(idx).visible(true);
			} else {
				table.column(idx).visible(false);
			}
		}
	});
}

function vulnerability_format_details(row) {
    let html = '<div class="card p-3 m-2 shadow-sm border-left-primary bg-light">';
    html += '<div class="row">';
    
    // Left side: Meta & Description
    html += '<div class="col-md-7 border-end">';
    html += `<h5 class="text-primary"><i class="fe-info me-1"></i> Description</h5><p class="text-dark">${htmlEncode(row.description || 'No description available.')}</p>`;
    if (row.references) {
        html += '<h5 class="text-primary mt-3"><i class="fe-link me-1"></i> References</h5><ul class="ps-3">';
        row.references.split('\n').forEach(ref => {
            if (ref.trim()) html += `<li class="mb-1"><a href="${ref.trim()}" target="_blank" class="text-info text-break">${ref.trim()}</a></li>`;
        });
        html += '</ul>';
    }
    if (row.cvss_metrics) {
        html += `<div class="mt-3"><strong>CVSS Metrics:</strong> <code class="text-muted">${row.cvss_metrics}</code></div>`;
    }
    html += '</div>';

    // Right side: Technical Data & Exploits
    html += '<div class="col-md-5">';
    html += '<h5 class="text-primary"><i class="fe-cpu me-1"></i> Technical Details</h5>';
    html += `<table class="table table-sm table-borderless mt-2">`;
    html += `<tr><td><strong>Type:</strong></td><td>${row.type || 'N/A'}</td></tr>`;
    html += `<tr><td><strong>Tags:</strong></td><td>${row.tags ? `<span class="badge badge-soft-info">${row.tags}</span>` : 'None'}</td></tr>`;
    html += `<tr><td><strong>Discovered:</strong></td><td>${row.discovered_date || 'Unknown'}</td></tr>`;
    if (row.cve_ids) html += `<tr><td><strong>CVE IDs:</strong></td><td><span class="text-danger">${row.cve_ids}</span></td></tr>`;
    if (row.cwe_ids) html += `<tr><td><strong>CWE IDs:</strong></td><td><span class="text-warning">${row.cwe_ids}</span></td></tr>`;
    html += `</table>`;
    
    if (row.exploit_url) {
        html += `<div class="alert alert-soft-danger mt-3 border-danger shadow-sm">`;
        html += `<div class="d-flex justify-content-between align-items-center mb-2">`;
        html += `<span><i class="fe-zap text-danger me-1"></i> <strong>Potential Exploit Found</strong></span>`;
        html += `<a href="${row.exploit_url}" target="_blank" class="btn btn-xs btn-danger"><i class="fe-external-link"></i> Source</a>`;
        html += `</div>`;
        html += `<p class="mb-2 text-dark small">Validation: <span class="badge badge-soft-dark">${row.validation_status || 'Unverified'}</span></p>`;
        html += `<button class="btn btn-sm btn-outline-danger w-100" onclick="preview_exploit('${row.exploit_url}', ${row.id})"><i class="fe-eye me-1"></i> Preview Exploit Content</button>`;
        html += `<div id="exploit-preview-${row.id}" class="mt-2" style="display:none;"><pre class="bg-dark text-white p-2 rounded" style="max-height:250px; overflow-y:auto; font-size: 11px;"></pre></div>`;
        html += `</div>`;
    }

    if (row.curl_command) {
        html += `<h5 class="text-primary mt-3"><i class="fe-terminal me-1"></i> CURL Command</h5><div class="position-relative"><pre class="bg-dark text-light p-2 rounded" style="font-size: 11px;"><code>${htmlEncode(row.curl_command)}</code></pre></div>`;
    }
    
    if (row.extracted_results) {
        html += `<h5 class="text-primary mt-3"><i class="fe-search me-1"></i> Extracted Results</h5><pre class="bg-white p-2 border rounded" style="max-height:150px; font-size: 11px;"><code>${htmlEncode(row.extracted_results)}</code></pre>`;
    }

    html += '</div>';
    html += '</div></div>';
    return html;
}

function preview_exploit(url, id) {
    const previewDiv = $(`#exploit-preview-${id}`);
    const pre = previewDiv.find('pre');
    if (previewDiv.is(':visible')) {
        previewDiv.slideUp();
        return;
    }
    previewDiv.slideDown();
    pre.text('Fetching exploit content...');
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            return response.text();
        })
        .then(text => {
            pre.text(text);
        })
        .catch(err => {
            pre.html(`<span class="text-warning">Unable to preview content directly (likely due to security restrictions / CORS).</span><br><br><span class="text-muted">Error: ${err.message}</span><br><br><a href="${url}" target="_blank" class="btn btn-xs btn-outline-light">Open in New Tab</a>`);
        });
}

// Global click listener for vulnerability details toggle
$(document).on('click', '#vulnerability_results tbody td', function (e) {
    // Don't trigger if clicking a button, link, or checkbox
    if ($(e.target).closest('button, a, input, .dropdown').length) return;
    
    const table = $('#vulnerability_results').DataTable();
    const tr = $(this).closest('tr');
    const row = table.row(tr);

    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown details-expanded');
    } else {
        row.child(vulnerability_format_details(row.data())).show();
        tr.addClass('shown details-expanded');
    }
});
