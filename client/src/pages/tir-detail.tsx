import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, Share2, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TirForm from "@/components/tir-form";
import DocumentUpload from "@/components/document-upload";
import ShareLinkManager from "@/components/share-link-manager";
import { TirWithDocuments, DocumentsByType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TirDetail() {
  const [, params] = useRoute("/tir/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tirId = params?.id;
  const isNew = tirId === "new";

  const { data: tirData, isLoading } = useQuery<TirWithDocuments & { documentsByType: DocumentsByType }>({
    queryKey: [`/api/tirs/${tirId}`],
    enabled: !isNew,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tirs/${tirId}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "TIR profili başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tirs"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "TIR profili silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Bu TIR profilini ve tüm belgelerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteMutation.mutate();
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="h-32 bg-slate-200 rounded"></div>
                    <div className="h-20 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isNew && !tirData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">TIR bulunamadı</h3>
              <p className="text-slate-600 mb-4">Aradığınız TIR profili mevcut değil</p>
              <Button onClick={() => setLocation("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              <div className="flex items-center">
                <Truck className="h-6 w-6 text-primary mr-3" />
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">
                    {isNew ? "Yeni TIR Profili" : "TIR Profil Detayları"}
                  </h1>
                  {tirData && (
                    <p className="text-sm text-slate-600">{tirData.phone}</p>
                  )}
                </div>
              </div>
            </div>
            {!isNew && tirData && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  TIR Sil
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Temel Bilgiler</TabsTrigger>
            {!isNew && (
              <>
                <TabsTrigger value="documents">Belgeler</TabsTrigger>
                <TabsTrigger value="sharing">Paylaşım</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isNew ? "Yeni TIR Profili Oluştur" : "TIR Bilgilerini Düzenle"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TirForm tir={tirData} isNew={isNew} />
              </CardContent>
            </Card>
          </TabsContent>

          {!isNew && tirData && (
            <>
              <TabsContent value="documents">
                <DocumentUpload tirId={tirData.id} documentsByType={tirData.documentsByType} />
              </TabsContent>

              <TabsContent value="sharing">
                <ShareLinkManager tirId={tirData.id} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
