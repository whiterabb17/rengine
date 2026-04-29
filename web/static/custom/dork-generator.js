/**
 * Custom Dork Generation Logic for reNgine
 * Part of the effort to modularize custom.js
 */

$(document).ready(function() {
    // Toggle Custom Dork Component visibility
    $(document).on('change', '#customDorkSwitch', function() {
        if ($(this).is(':checked')) {
            $('#customDorkComponent').slideDown();
        } else {
            $('#customDorkComponent').slideUp();
        }
    });

    // Generate Dorks based on target domain
    $(document).on('click', '#btnGenerateDorks', function() {
        const domain = $('#targetDomainName').text();
        
        if (!domain) {
            if (typeof Snackbar !== 'undefined') {
                Snackbar.show({
                    text: 'Error: Could not identify target domain name.',
                    pos: 'top-right',
                    duration: 2500,
                    actionTextColor: '#ff0000'
                });
            } else {
                alert('Error: Could not identify target domain name.');
            }
            return;
        }
        
        // Comprehensive Dork Generation Patterns
        const dorkPatterns = [
            'site:{domain} ext:php',
            'site:{domain} ext:log',
            'site:{domain} ext:txt',
            'site:{domain} ext:conf',
            'site:{domain} ext:cnf',
            'site:{domain} ext:ini',
            'site:{domain} ext:env',
            'site:{domain} ext:sql',
            'site:{domain} ext:db',
            'site:{domain} ext:backup',
            'site:{domain} ext:bak',
            'site:{domain} inurl:admin',
            'site:{domain} inurl:login',
            'site:{domain} inurl:dashboard',
            'site:{domain} inurl:config',
            'site:{domain} "index of /"',
            'site:{domain} "password"',
            'site:{domain} "API_KEY"',
            'site:{domain} "secret"',
            'site:{domain} "aws_secret_key"',
            'site:{domain} "db_password"',
            'site:{domain} "root"',
            'site:{domain} intext:"sql syntax near"',
            'site:{domain} intext:"syntax error in query expression"',
            'site:{domain} intext:"web.config"',
            'site:{domain} intitle:"index of" "parent directory"',
            'site:{domain} inurl:phpinfo',
            'site:{domain} inurl:shell'
        ];

        let generatedDorks = "";
        dorkPatterns.forEach(pattern => {
            generatedDorks += pattern.replace(/{domain}/g, domain) + "\n";
        });

        $('#customDorkTextarea').val(generatedDorks);
        
        if (typeof Snackbar !== 'undefined') {
            Snackbar.show({
                text: 'Dork list generated successfully!',
                pos: 'top-right',
                duration: 2500
            });
        }
    });
});
