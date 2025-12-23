export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-gray-900 py-16 px-4">
            <div className="max-w-3xl mx-auto prose prose-blue">
                <h1>Privacy Policy</h1>
                <p className="text-gray-500 text-lg">Last modified: December 14, 2025</p>

                <h2>1. Introduction</h2>
                <p>
                    Welcome to DoEverything App ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy.
                    This Privacy Policy describes how we collect, use, and share your data when you use our services.
                </p>

                <h2>2. Information We Collect</h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul>
                    <li>Account information (name, email, password, avatar)</li>
                    <li>Webhook configurations (endpoints, headers, templates)</li>
                    <li>Chat history and interactions with our AI</li>
                    <li>API keys (encrypted and stored securely)</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process your webhook automation requests</li>
                    <li>Communicate with you about updates and security alerts</li>
                    <li>Detect and prevent fraud or abuse</li>
                </ul>

                <h2>4. Data Security</h2>
                <p>
                    We implement appropriate technical and organizational measures to protect your personal information.
                    All sensitive API keys and headers are encrypted using AES-256-GCM before storage.
                </p>

                <h2>5. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at support@doeverything.app.
                </p>
            </div>
        </div>
    );
}
