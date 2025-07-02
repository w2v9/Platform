import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        // Construct the PDF directory path
        const pdfDir = path.join(process.cwd(), 'src', 'data', 'pdf');

        // Check if directory exists
        if (!fs.existsSync(pdfDir)) {
            return NextResponse.json(
                { error: 'PDF directory not found' },
                { status: 404 }
            );
        }

        // Read directory contents
        const files = fs.readdirSync(pdfDir);

        // Filter for PDF files only and get file stats
        const pdfFiles = files
            .filter(file => file.toLowerCase().endsWith('.pdf'))
            .map(file => {
                const filePath = path.join(pdfDir, file);
                const stats = fs.statSync(filePath);

                return {
                    name: file,
                    size: stats.size,
                    lastModified: stats.mtime,
                    displayName: file.replace('.pdf', '').replace(/[-_]/g, ' ')
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ files: pdfFiles });
    } catch (error) {
        console.error('Error listing PDF files:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
