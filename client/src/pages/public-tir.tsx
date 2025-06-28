import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Truck, MapPin, Phone, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TirWithDocuments, DocumentsByType } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";

export default function PublicTir() {
  const [, params] = useRoute("/share/tir/:token");
  const token = params?.token;

  const { data: tirData, isLoading, error } = useQuery<TirWithDocuments & { documentsByType: DocumentsByType }>({
    queryKey: [`/api/public/tir/${token}`],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !tirData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">TIR Bulunamadı</h3>
              <p className="text-slate-600 mb-4">
                Bu paylaşım linki geçersiz, süresi dolmuş veya deaktive edilmiş olabilir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      T1: "T1 Belgeleri",
      CMR: "CMR Belgeleri",
      Invoice: "Faturalar",
      Doctor: "Doktor Kağıtları",
      TurkishInvoice: "Türk Faturaları",
      Other: "Diğer Belgeler",
    };
    return titles[category] || category;
  };

  const totalDocuments = Object.values(tirData.documentsByType).flat().length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-slate-800">GMİ TIR TAKİP</h1>
          </div>
          <p className="text-slate-600">TIR Profil Bilgileri - Salt Okunur Görünüm</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* TIR Profile Info */}
        <Card className="mb-8">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{tirData.phone}</CardTitle>
                <p className="text-sm text-slate-600">
                  Son güncelleme: {format(new Date(tirData.lastUpdated), "dd.MM.yyyy, HH:mm:ss", { locale: tr })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* TIR Information */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-4">TIR Bilgileri</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{tirData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{tirData.plate || "Plaka belirtilmemiş"}</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{tirData.trailerPlate || "Treyler plakası belirtilmemiş"}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{tirData.location || "Lokasyon belirtilmemiş"}</span>
                  </div>
                </div>
              </div>

              {/* Document Summary */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Belge Özeti</h4>
                <div className="space-y-2">
                  {Object.entries(tirData.documentsByType).map(([category, documents]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-slate-600">{getCategoryTitle(category)}:</span>
                      <Badge variant="secondary">{documents.length}</Badge>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">Toplam:</span>
                      <Badge className="bg-primary/10 text-primary">{totalDocuments}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Belgeler</CardTitle>
          </CardHeader>
          <CardContent>
            {totalDocuments === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Belge bulunamadı</h3>
                <p className="text-slate-600">Bu TIR profili için henüz belge yüklenmemiş</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {Object.entries(tirData.documentsByType)
                  .filter(([, documents]) => documents.length > 0)
                  .map(([category, documents]) => (
                    <AccordionItem key={category} value={category} className="border border-slate-200 rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-slate-600 mr-2" />
                          <span className="font-medium text-slate-800">{getCategoryTitle(category)}</span>
                          <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                              <div className="flex items-center">
                                <span className="text-xl mr-3">{getFileIcon(doc.fileName)}</span>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{doc.fileName}</p>
                                  <p className="text-xs text-slate-500">
                                    {format(new Date(doc.uploadDate), "dd.MM.yyyy, HH:mm", { locale: tr })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(doc.cloudinaryUrl, '_blank')}
                              >
                                Görüntüle
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Bu sayfa salt okunur modda görüntülenmektedir.</p>
          <p className="mt-1">© 2024 GMİ TIR TAKİP Sistemi</p>
        </div>
      </div>
    </div>
  );
}
