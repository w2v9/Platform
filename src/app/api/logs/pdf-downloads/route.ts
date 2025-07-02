import { NextRequest, NextResponse } from 'next/server';
import { getPdfDownloadLogs, downloadLogsFile } from '@/lib/utils/logs-utils';

export async function GET(request: NextRequest) {
    try {
        const result = await getPdfDownloadLogs();

        if (result.error) {
            return NextResponse.json({ logs: [], error: result.error }, { status: 404 });
        }

        return NextResponse.json({ logs: result.logs, error: null });
    } catch (error) {
        console.error('Error reading logs file:', error);
        return NextResponse.json({ logs: [], error: 'Failed to read logs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const result = await downloadLogsFile();

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }

        // Return the content as a downloadable file
        return new NextResponse(result.content, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="pdf-downloads.jsonl"',
            },
        });
    } catch (error) {
        console.error('Error downloading logs file:', error);
        return NextResponse.json({ error: 'Failed to download logs' }, { status: 500 });
    }
}
