import React from "react";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="text-center py-4 px-4 md:px-8 mt-auto border-t border-border bg-muted/20">
            <p className="text-sm md:text-base">&copy; {currentYear} AzoozGAT Platform. All rights reserved.</p>
        </footer>
    );
};

export default Footer;