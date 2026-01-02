import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, CalendarDays, Tag, X } from "lucide-react";
import type { ClientNews } from "@shared/schema";
import Navigation from "../static-pages/navigation";
import Footer from "../static-pages/footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Add Meera font for Malayalam support
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Meera+Inimai&display=swap');
  
  .malayalam-text {
    font-family: 'Meera Inimai', 'Noto Sans Malayalam', sans-serif;
    line-height: 1.8;
  }
`;
document.head.appendChild(style);

export default function NewsSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedArticle, setSelectedArticle] = useState<ClientNews | null>(null);

    // Auto-filter by type if passed as query param
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const typeParam = urlParams.get("type");
        if (typeParam && ["announcement", "news", "update"].includes(typeParam)) {
            setSelectedType(typeParam);
        }
    }, []);

    const { data: news = [], isLoading } = useQuery<ClientNews[]>({
        queryKey: ["/api/news"],
        queryFn: async () => {
            const res = await fetch("/api/news");
            if (!res.ok) throw new Error("Failed to fetch news");
            const data = await res.json();
            return data.map((item: any) => ({
                ...item,
                createdAt: new Date(item.createdAt),
            }));
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading news...</span>
            </div>
        );
    }

    // Filter news by search and type
    const filteredNews = news.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || item.type === selectedType;
        return matchesSearch && matchesType;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case "announcement":
                return "bg-blue-600 text-white";
            case "news":
                return "bg-green-600 text-white";
            case "update":
                return "bg-purple-600 text-white";
            default:
                return "bg-gray-600 text-white";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "announcement":
                return "📢";
            case "news":
                return "📰";
            case "update":
                return "⚡";
            default:
                return "📄";
        }
    };

    return (
        <>
           <br />
            <br />
            <br />
            <br />
            <Navigation />
            <section id="news" className="py-20 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2
                            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                            data-aos="fade-up"
                        >
                            Latest News & Announcements
                        </h2>
                        <p
                            className="text-xl text-muted-foreground max-w-2xl mx-auto"
                            data-aos="fade-up"
                            data-aos-delay="200"
                        >
                            Stay informed with the latest updates, announcements, and news from our school
                        </p>
                    </div>

                    {/* Search and Filter Bar */}
                    <div
                        className="bg-card p-6 rounded-2xl shadow-lg border border-border mb-12"
                        data-aos="slide-up"
                    >
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search news by title or content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                                />
                            </div>

                            {/* Type Filter */}
                            <div className="flex gap-2 flex-wrap md:flex-nowrap">
                                <button
                                    onClick={() => setSelectedType("all")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === "all"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setSelectedType("announcement")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === "announcement"
                                            ? "bg-blue-600 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    Announcements
                                </button>
                                <button
                                    onClick={() => setSelectedType("news")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === "news"
                                            ? "bg-green-600 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    News
                                </button>
                                <button
                                    onClick={() => setSelectedType("update")}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === "update"
                                            ? "bg-purple-600 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    Updates
                                </button>
                            </div>
                        </div>

                        {/* Results count */}
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredNews.length} of {news.length} news items
                        </p>
                    </div>

                    {/* News Grid */}
                    {filteredNews.length === 0 ? (
                        <div className="bg-card p-12 rounded-2xl shadow-lg border border-border text-center">
                            <p className="text-muted-foreground text-lg">
                                {searchQuery || selectedType !== "all"
                                    ? "No news found matching your filters"
                                    : "No news available at the moment"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
                            {filteredNews.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl hover:border-primary transition-all duration-300 hover-lift"
                                    data-aos="fade-up"
                                    data-aos-delay={index * 100}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-2xl">{getTypeIcon(item.type)}</span>
                                            <span
                                                className={`${getTypeColor(item.type)} text-xs font-semibold px-3 py-1 rounded-full`}
                                            >
                                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                            </span>
                                        </div>
                                        {item.expiresAt && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                Expires:{" "}
                                                {new Date(item.expiresAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                                        {item.title}
                                    </h3>

                                    <p className="text-muted-foreground mb-4 line-clamp-3">
                                        {item.content}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4" />
                                            <span>
                                                {new Date(item.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            <span className="capitalize">{item.type}</span>
                                        </div>
                                    </div>

                                    {/* Read More Link */}
                                    <button
                                        onClick={() => {
                                            setSelectedArticle(item);
                                        }}
                                        className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary-foreground font-medium transition-colors group"
                                    >
                                        Read Full Article
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats Section */}
                    {news.length > 0 && (
                        <div className="mt-16 grid md:grid-cols-3 gap-6">
                            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center">
                                <p className="text-4xl font-bold text-primary mb-2">{news.length}</p>
                                <p className="text-muted-foreground">Total News Items</p>
                            </div>
                            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center">
                                <p className="text-4xl font-bold text-blue-600 mb-2">
                                    {news.filter((n) => n.type === "announcement").length}
                                </p>
                                <p className="text-muted-foreground">Announcements</p>
                            </div>
                            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center">
                                <p className="text-4xl font-bold text-green-600 mb-2">
                                    {news.filter((n) => n.type === "news").length}
                                </p>
                                <p className="text-muted-foreground">News Articles</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Full Article Modal */}
            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedArticle && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between w-full mb-4">
                                    <span className={`${getTypeColor(selectedArticle.type)} text-xs font-semibold px-3 py-1 rounded-full`}>
                                        {selectedArticle.type.charAt(0).toUpperCase() + selectedArticle.type.slice(1)}
                                    </span>
                                    {selectedArticle.expiresAt && (
                                        <span className="text-xs text-muted-foreground">
                                            Expires: {new Date(selectedArticle.expiresAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    )}
                                </div>
                                <DialogTitle className="text-3xl leading-tight">
                                    {selectedArticle.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-4 text-sm mt-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        <span>
                                            {new Date(selectedArticle.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        <span className="capitalize">{selectedArticle.type}</span>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="mt-6">
                                <p className="text-foreground leading-relaxed malayalam-text text-lg whitespace-pre-wrap">
                                    {selectedArticle.content}
                                </p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <br />    
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />


            <Footer />
        </>
    );
}
