
def parse_nmap_generic_vuln_output(script_id, script_output):
    if not script_output or not script_output.strip():
        return []
    
    lower_output = script_output.lower()
    
    # List of common "negative" indicators in nmap script output
    false_positive_indicators = [
        "couldn't find",
        "could not find",
        "error: script execution failed",
        "no reply from server",
        "timeout",
        "did not work",
        "might not be vulnerable",
        "not vulnerable",
        "no findings",
        "0 vulnerabilities found",
        "no vulnerabilities found",
        "vulnerabilities: 0",
        "vulnerable: no",
    ]
    
    if any(indicator in lower_output for indicator in false_positive_indicators):
        return []

    return [{
        'name': f'Nmap Vuln Script: {script_id}',
        'severity': 2, # Medium by default for vuln scripts
        'description': f'Nmap script {script_id} flagged a potential issue:\n{script_output}',
        'type': 'Vulnerability',
        'tags': ['auth_portal'] if any(x in script_output.lower() for x in ['login', 'auth', 'brute', 'password']) else []
    }]

# Test cases from user
test_cases = [
    ("http-fileupload-exploiter", "Couldn't find a file-type field."),
    ("http-vuln-cve2014-3704", "ERROR: Script execution failed (use -d to debug)"),
    ("clamav-exec", "ERROR: Script execution failed (use -d to debug)"),
    ("http-stored-xss", "Couldn't find any stored XSS vulnerabilities."),
    ("http-dombased-xss", "Couldn't find any DOM based XSS."),
    ("sslv2-drown", ""),
    ("ssl-ccs-injection", "No reply from server (TIMEOUT)"),
    ("http-litespeed-sourcecode-download", "Request with null byte did not work. This web server might not be vulnerable"),
]

# Positive test case
positive_cases = [
    ("http-vuln-cve2017-0144", "State: VULNERABLE\nRisk factor: High"),
]

print("Testing False Positives:")
for script_id, output in test_cases:
    result = parse_nmap_generic_vuln_output(script_id, output)
    print(f"ID: {script_id} | Output: {output[:30]}... | Result: {'Filtered' if not result else 'NOT FILTERED'}")

print("\nTesting Positive Cases:")
for script_id, output in positive_cases:
    result = parse_nmap_generic_vuln_output(script_id, output)
    print(f"ID: {script_id} | Output: {output[:30]}... | Result: {'Filtered' if not result else 'NOT FILTERED'}")
