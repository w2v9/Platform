'use client';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";


export function ActionCard({
    title,
    description,
    icon: Icon,
    action,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    action: string;
}) {
    const router = useRouter();
    return (
        <Card
            onClick={() => router.push(action)}
            className="cursor-pointer rounded-lg border bg-muted/50 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Icon className="h-16 w-16 text-muted-foreground" />
                    <CardTitle>{title}</CardTitle>
                </div>
                <Separator />
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
            </CardContent>
        </Card>
    );
}