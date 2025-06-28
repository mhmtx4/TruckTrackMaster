import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Truck, MapPin, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type PublicTir = {
  id: string;
  phone: string;
  plate?: string;
  location?: string;
  lastUpdated: string;
};

export default function PublicList() {
  const [, params] = useRoute("/share/list/:token");
  const token = params?.token;

  const { data: tirs = [], isLoading, error } = useQuery<PublicTir[]>({
    queryKey: [`/api/public/list/${token}`],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !tirs) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Liste Bulunamadı</h3>
              <p className="text-slate-600 mb-4">
                Bu paylaşım linki geçersiz, süresi dolmuş veya deaktive edilmiş olabilir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-slate-800">GMİ TIR TAKİP</h1>
          </div>
          <p className="text-slate-600">TIR Listesi - Salt Okunur Görünüm</p>
          <div className="mt-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Toplam {tirs.length} TIR
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {tirs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">TIR bulunamadı</h3>
              <p className="text-slate-600">Sistemde kayıtlı aktif TIR bulunmamaktadır</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tirs.map((tir) => (
              <Card key={tir.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-slate-800">{tir.phone}</h3>
                        <p className="text-sm text-slate-600">
                          {tir.plate || "Plaka belirtilmemiş"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-slate-600">{tir.phone}</span>
                    </div>
                    {tir.plate && (
                      <div className="flex items-center text-sm">
                        <Truck className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-slate-600">{tir.plate}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-slate-600">
                        {tir.location || "Lokasyon belirtilmemiş"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Son güncelleme:</span>
                    </div>
                    <div className="font-medium text-slate-700 text-sm mt-1">
                      {format(new Date(tir.lastUpdated), "dd.MM.yyyy, HH:mm", { locale: tr })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Bu sayfa salt okunur modda görüntülenmektedir.</p>
          <p className="mt-1">© 2024 GMİ TIR TAKİP Sistemi</p>
        </div>
      </div>
    </div>
  );
}
