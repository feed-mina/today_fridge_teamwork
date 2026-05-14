import Header from "./Header";
import Footer from "./Footer";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#fdfaf6] text-[#3f3a36] flex flex-col">
            <Header />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6">
                {children}
            </main>
            <Footer />
            <FloatingChatbot />
        </div>
    );
}