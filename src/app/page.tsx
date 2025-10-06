import Navbar from './components/Navbar';
import Bridge from './components/Bridge';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#16213e]">
      <Navbar />
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Bridge />
      </main>
    </div>
  );
}
