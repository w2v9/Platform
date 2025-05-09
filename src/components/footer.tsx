import React from "react";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="text-center py-4 mt-auto">
            <p>&copy; {currentYear} AzoozGAT Platform. All rights reserved.</p>
        </footer>
    );
};

export default Footer;