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
            <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Icon className="h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground" />
                    <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
                </div>
                <Separator className="my-2 sm:my-4" />
                <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end p-4 sm:p-6 pt-0 sm:pt-0">
            </CardContent>
        </Card>
    );
}