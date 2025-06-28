import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Truck, Settings, Search, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TirCard from "@/components/tir-card";
import { TirWithDocuments } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");

  const { data: tirs = [], isLoading } = useQuery<(TirWithDocuments & { documentCount: number })[]>({
    queryKey: ["/api/tirs"],
  });

  const filteredAndSortedTirs = tirs
    .filter((tir) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        tir.phone.toLowerCase().includes(query) ||
        (tir.plate && tir.plate.toLowerCase().includes(query)) ||
        (tir.location && tir.location.toLowerCase().includes(query));
      
      const matchesLocation = !locationFilter || locationFilter === "all" || 
        (tir.location && tir.location.toLowerCase().includes(locationFilter.toLowerCase()));

      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "updated_asc":
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "phone":
          return a.phone.localeCompare(b.phone);
        default: // updated_desc
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

  const uniqueLocations = Array.from(new Set(tirs.filter(tir => tir.location).map(tir => tir.location)));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-slate-800">GMİ TIR TAKİP</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Link href="/tir/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni TIR
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">TIR Listesi</h2>
              <p className="text-slate-600 mt-1">Tüm aktif TIR profillerini görüntüleyin ve yönetin</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Liste Paylaş
              </Button>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>Toplam:</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {tirs.length}
                </Badge>
                <span>TIR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Ara</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Telefon, plaka veya lokasyon ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lokasyon</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location!}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sıralama</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_desc">Son güncelleme (Yeni)</SelectItem>
                    <SelectItem value="updated_asc">Son güncelleme (Eski)</SelectItem>
                    <SelectItem value="phone">Telefon numarası</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TIR Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedTirs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || locationFilter ? "Arama kriterlerinize uygun TIR bulunamadı" : "Henüz TIR kaydı yok"}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || locationFilter 
                  ? "Farklı arama terimleri deneyin veya filtreleri temizleyin"
                  : "İlk TIR profilinizi oluşturmak için başlayın"
                }
              </p>
              {!searchQuery && !locationFilter && (
                <Link href="/tir/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    İlk TIR'ı Ekle
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTirs.map((tir) => (
              <TirCard key={tir.id} tir={tir} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
