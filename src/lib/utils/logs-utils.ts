"use server";

import fs from 'fs';
import path from 'path';

export async function getPdfDownloadLogs() {
    try {
        const logsPath = path.join(process.cwd(), 'src', 'data', 'logs', 'pdf-downloads.jsonl');

        if (!fs.existsSync(logsPath)) {
            return { logs: [], error: null };
        }

        const content = fs.readFileSync(logsPath, 'utf-8');
        const lines = content.trim().split('\n');

        const logs = lines
            .filter(line => line.trim() !== '')
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (err) {
                    console.error('Error parsing log line:', err);
                    return null;
                }
            })
            .filter(Boolean);

        return { logs, error: null };
    } catch (error) {
        console.error('Error reading logs file:', error);
        return { logs: [], error: 'Failed to read logs' };
    }
}

export async function downloadLogsFile() {
    try {
        const logsPath = path.join(process.cwd(), 'src', 'data', 'logs', 'pdf-downloads.jsonl');

        if (!fs.existsSync(logsPath)) {
            return { success: false, error: 'Logs file not found' };
        }

        const content = fs.readFileSync(logsPath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        console.error('Error downloading logs file:', error);
        return { success: false, error: 'Failed to download logs' };
    }
}
