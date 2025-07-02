import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('pdf') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No PDF file provided' },
                { status: 400 }
            );
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'File must be a PDF' },
                { status: 400 }
            );
        }

        // Read the uploaded PDF
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Extract metadata
        const title = pdfDoc.getTitle();
        const subject = pdfDoc.getSubject();
        const keywords = pdfDoc.getKeywords();
        const creator = pdfDoc.getCreator();

        // Try to extract watermark data from various locations
        const watermarkResults = [];

        // Check if it's from our platform
        if (creator === 'AzoozGAT Platform') {
            watermarkResults.push({
                location: 'metadata',
                type: 'creator',
                data: creator
            });
        }

        if (title) {
            watermarkResults.push({
                location: 'metadata',
                type: 'title',
                data: title
            });
        }

        if (subject) {
            watermarkResults.push({
                location: 'metadata',
                type: 'subject',
                data: subject
            });
        }

        if (keywords && keywords.length > 0) {
            // Ensure keywords is an array
            const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

            let userId = null;
            let downloadTime = null;

            if (keywordArray.length >= 2) {
                // Format: [userId, timestamp] - separate elements
                userId = keywordArray[0];
                downloadTime = keywordArray[1];
            } else if (keywordArray.length === 1) {
                // Format: "userId timestamp" - combined in one string
                const combined = keywordArray[0].toString();
                const match = combined.match(/^([a-zA-Z0-9]+)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
                if (match) {
                    userId = match[1];
                    downloadTime = match[2];
                }
            }

            if (userId && downloadTime) {
                watermarkResults.push({
                    location: 'metadata',
                    type: 'keywords',
                    data: {
                        userId: userId,
                        downloadTime: downloadTime
                    }
                });
            }
        }

        // Read download log to find matching records
        const logsDir = path.join(process.cwd(), 'src', 'data', 'logs');
        const logFilePath = path.join(logsDir, 'pdf-downloads.jsonl');

        let downloadRecords = [];
        if (fs.existsSync(logFilePath)) {
            const logContent = fs.readFileSync(logFilePath, 'utf-8');
            const logLines = logContent.trim().split('\n');

            downloadRecords = logLines
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(record => record !== null);
        }

        // Try to match this PDF with download records
        let matchingRecords = [];

        if (watermarkResults.length > 0) {
            // Look for matching records based on extracted data
            const keywordData = watermarkResults.find(r => r.type === 'keywords')?.data;

            if (keywordData && typeof keywordData === 'object' && 'userId' in keywordData) {
                matchingRecords = downloadRecords.filter(record =>
                    record.userId === keywordData.userId &&
                    record.downloadTime === keywordData.downloadTime
                );
            }

            // If no exact match, try broader search
            if (matchingRecords.length === 0 && keywordData && typeof keywordData === 'object' && 'userId' in keywordData) {
                matchingRecords = downloadRecords.filter(record =>
                    record.userId === keywordData.userId
                );
            }
        }

        // Determine verification status
        let verificationStatus = 'unknown';
        let confidence = 0;

        if (creator === 'AzoozGAT Platform') {
            confidence += 30;
        }

        if (watermarkResults.length > 0) {
            confidence += 20;
        }

        if (matchingRecords.length > 0) {
            confidence += 50;
            verificationStatus = 'verified';
        } else if (creator === 'AzoozGAT Platform') {
            verificationStatus = 'likely_verified';
        } else {
            verificationStatus = 'not_verified';
        }

        return NextResponse.json({
            success: true,
            verification: {
                status: verificationStatus,
                confidence: Math.min(confidence, 100),
                watermarkData: watermarkResults,
                matchingDownloads: matchingRecords,
                metadata: {
                    title,
                    subject,
                    keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
                    creator
                }
            }
        });

    } catch (error) {
        console.error('Error verifying PDF:', error);
        return NextResponse.json(
            { error: 'Failed to verify PDF' },
            { status: 500 }
        );
    }
}
