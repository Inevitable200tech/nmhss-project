// src/pages/not-found.tsx
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-6">
      <h1 className="text-6xl font-bold mb-4 text-red-500">404</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Link to="/">
        <a className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition">
          Go Back Home
        </a>
      </Link>

      {/* Footer credit */}
      <footer className="absolute bottom-6 text-sm text-muted-foreground">
        Created by <span className="font-semibold">NMHSS Navamukunda Thirunavaya</span>
      </footer>
    </div>
  );
}
