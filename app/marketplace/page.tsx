"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { formatAtomicToUsd, formatAddress } from "@/lib/utils";
import {
  Search,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
} from "lucide-react";

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["services", searchTerm, selectedCategory, selectedNetwork, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchTerm,
        category: selectedCategory,
        network: selectedNetwork,
        sort: sortBy,
        page: page.toString(),
        limit: "12",
      });
      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load services");
      return res.json();
    },
  });

  const categories = [
    { label: "All Categories", value: "ALL" },
    { label: "AI Inference", value: "AI_INFERENCE" },
    { label: "Data Feeds", value: "DATA_FEEDS" },
    { label: "Financial", value: "FINANCIAL" },
    { label: "Utility", value: "UTILITY" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Badge variant="cyan" className="mb-2 font-mono">
            x402 Service Registry
          </Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">API Marketplace</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse payment-protected APIs designed for programmatic AI agent consumption and micro-metered access.
          </p>
        </div>
        <Link href="/provider/services">
          <Button variant="gradient" size="sm">
            Publish Your API
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search APIs by name, description, slug..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-xl border border-slate-800/80 bg-slate-900/40 animate-pulse p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
          Failed to load marketplace services. Please try again.
        </div>
      ) : data?.services?.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <Layers className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No services found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting category filters to see more results.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("ALL");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.services?.map((service: any) => (
            <Card
              key={service.id}
              className="flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-blue-500/5 group"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {service.category.replace("_", " ")}
                  </Badge>
                  {service.isDemo && (
                    <Badge variant="cyan" className="text-[10px]">
                      Demo Service
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base group-hover:text-blue-400 transition-colors">
                  {service.name}
                </CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1">
                  {service.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="rounded-lg bg-slate-950 p-2.5 text-xs font-mono border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Price / req:</span>
                    <span className="font-semibold text-emerald-400">
                      {formatAtomicToUsd(service.price)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Network:</span>
                    <span className="text-slate-300">Base Sepolia</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="text-blue-400 truncate max-w-[160px]">{service.endpointPath}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 gap-2 border-t border-slate-800/50 p-4">
                <Link href={`/marketplace/${service.slug}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full text-xs">
                    Try API
                  </Button>
                </Link>
                <Link href={`/marketplace/${service.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
