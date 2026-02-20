#!/usr/bin/env node
/**
 * Download Sectigo certificate chain for bonk.io servers
 * This script builds a complete certificate chain for bonk.io servers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'bonk_fullchain.pem');

/**
 * Download intermediate certificate from Sectigo
 */
function downloadIntermediateCert() {
    try {
        console.log('Downloading intermediate certificate from Sectigo...');

        // Use HTTP (not HTTPS) to avoid certificate issues
        const intermediateUrl = 'http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt';

        // Download and convert DER to PEM
        const command = `curl -s "${intermediateUrl}" | openssl x509 -inform DER -outform PEM`;

        const intermediatePem = execSync(command, {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024
        });

        if (!intermediatePem || !intermediatePem.includes('BEGIN CERTIFICATE')) {
            throw new Error('Failed to download intermediate certificate');
        }

        return intermediatePem;
    } catch (error) {
        console.warn('Warning: Could not download intermediate certificate:', error.message);
        return null;
    }
}

/**
 * Download root certificate
 */
function downloadRootCert() {
    try {
        console.log('Downloading root certificate...');

        // USERTrust RSA Certification Authority (root)
        const rootUrl = 'http://crt.usertrust.com/USERTrustRSACertificationAuthority.crt';

        // Download and convert DER to PEM
        const command = `curl -s "${rootUrl}" | openssl x509 -inform DER -outform PEM`;

        const rootPem = execSync(command, {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024
        });

        if (!rootPem || !rootPem.includes('BEGIN CERTIFICATE')) {
            throw new Error('Failed to download root certificate');
        }

        return rootPem;
    } catch (error) {
        console.warn('Warning: Could not download root certificate:', error.message);
        return null;
    }
}

/**
 * Main function to download and save certificate chain
 */
function main() {
    console.log('Building Sectigo certificate chain for bonk.io...');

    try {
        const certs = [];
        let certCount = 0;

        // Download intermediate certificate
        const intermediate = downloadIntermediateCert();
        if (intermediate) {
            certs.push(intermediate);
            certCount++;
        }

        // Download root certificate
        const root = downloadRootCert();
        if (root) {
            certs.push(root);
            certCount++;
        }

        if (certs.length === 0) {
            throw new Error('Failed to download any certificates');
        }

        // Combine certificates (intermediate first, then root)
        const fullChain = certs.join('\n');

        // Save to file
        fs.writeFileSync(OUTPUT_FILE, fullChain, 'utf8');

        console.log(`Downloaded ${certCount} certificate(s)`);
        console.log(`Certificate chain saved to: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error downloading certificates:', error.message);
        console.error('\nNote: This script requires curl and openssl to be installed on your system.');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
