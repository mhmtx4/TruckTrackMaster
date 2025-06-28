import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Share2, Copy, ToggleLeft, ToggleRight, Calendar, Eye, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareLink } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ShareLinkManagerProps {
  tirId: string;
}

export default function ShareLinkManager({ tirId }: ShareLinkManagerProps) {
  const { toast } = useToast();
  const [expiryDate, setExpiryDate] = useState("");

  const { data: tirShareLinks = [] } = useQuery<ShareLink[]>({
    queryKey: ["/api/share/tir"],
  });

  const { data: listShareLinks = [] } = useQuery<ShareLink[]>({
    queryKey: ["/api/share/list"],
  });

  const currentTirLink = tirShareLinks.find(link => link.tirId === tirId);
  const currentListLink = listShareLinks[0]; // Assuming one list link for now

  const createTirLinkMutation = useMutation({
    mutationFn: async (data: { expiryDate?: string }) => {
      const response = await apiRequest("POST", `/api/tirs/${tirId}/share`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "TIR paylaşım linki oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/share/tir"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Paylaşım linki oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const createListLinkMutation = useMutation({
    mutationFn: async (data: { expiryDate?: string }) => {
      const response = await apiRequest("POST", "/api/share/list", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Liste paylaşım linki oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/share/list"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Liste paylaşım linki oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/share/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Paylaşım linki güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/share/tir"] });
      queryClient.invalidateQueries({ queryKey: ["/api/share/list"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Paylaşım linki güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Kopyalandı",
        description: "Link panoya kopyalandı",
      });
    } catch {
      toast({
        title: "Hata",
        description: "Link kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  const getFullUrl = (token: string, type: 'tir' | 'list') => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${type}/${token}`;
  };

  const toggleLinkStatus = (link: ShareLink) => {
    updateLinkMutation.mutate({
      id: link.id,
      data: { active: !link.active },
    });
  };

  const handleCreateTirLink = () => {
    createTirLinkMutation.mutate({
      expiryDate: expiryDate || undefined,
    });
  };

  const handleCreateListLink = () => {
    createListLinkMutation.mutate({
      expiryDate: expiryDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paylaşım Linkleri Yönetimi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expiry Date Selection */}
          <div>
            <Label htmlFor="expiryDate">Son Kullanma Tarihi (İsteğe Bağlı)</Label>
            <Input
              id="expiryDate"
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Boş bırakılırsa link süresiz olarak aktif kalacaktır
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TIR Specific Share Link */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-800">TIR Profil Linki</h4>
                  <div className="flex items-center space-x-2">
                    {currentTirLink ? (
                      <>
                        <Badge variant={currentTirLink.active ? "default" : "secondary"}>
                          {currentTirLink.active ? "Aktif" : "Pasif"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLinkStatus(currentTirLink)}
                        >
                          {currentTirLink.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateTirLink}
                        disabled={createTirLinkMutation.isPending}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Oluştur
                      </Button>
                    )}
                  </div>
                </div>

                {currentTirLink ? (
                  <>
                    <div className="bg-slate-50 rounded p-3 mb-3">
                      <code className="text-xs text-slate-600 break-all">
                        {getFullUrl(currentTirLink.token, 'tir')}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>Erişim: {currentTirLink.accessCount} kez</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getFullUrl(currentTirLink.token, 'tir'))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Kopyala
                          </Button>
                        </div>
                      </div>
                      {currentTirLink.lastAccessed && (
                        <p className="text-xs text-slate-500">
                          Son erişim: {format(new Date(currentTirLink.lastAccessed), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                      {currentTirLink.expiryDate && (
                        <p className="text-xs text-slate-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Son kullanma: {format(new Date(currentTirLink.expiryDate), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    Bu TIR profili için henüz paylaşım linki oluşturulmamış
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Global List Share Link */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-800">Genel Liste Linki</h4>
                  <div className="flex items-center space-x-2">
                    {currentListLink ? (
                      <>
                        <Badge variant={currentListLink.active ? "default" : "secondary"}>
                          {currentListLink.active ? "Aktif" : "Pasif"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLinkStatus(currentListLink)}
                        >
                          {currentListLink.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateListLink}
                        disabled={createListLinkMutation.isPending}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Oluştur
                      </Button>
                    )}
                  </div>
                </div>

                {currentListLink ? (
                  <>
                    <div className="bg-slate-50 rounded p-3 mb-3">
                      <code className="text-xs text-slate-600 break-all">
                        {getFullUrl(currentListLink.token, 'list')}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>Erişim: {currentListLink.accessCount} kez</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getFullUrl(currentListLink.token, 'list'))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Kopyala
                          </Button>
                        </div>
                      </div>
                      {currentListLink.lastAccessed && (
                        <p className="text-xs text-slate-500">
                          Son erişim: {format(new Date(currentListLink.lastAccessed), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                      {currentListLink.expiryDate && (
                        <p className="text-xs text-slate-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Son kullanma: {format(new Date(currentListLink.expiryDate), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    Tüm TIR listesi için henüz paylaşım linki oluşturulmamış
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Paylaşım Linki Bilgileri</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• TIR profil linki sadece bu TIR'ın bilgilerini gösterir</li>
              <li>• Genel liste linki tüm aktif TIR'ların özet bilgilerini gösterir</li>
              <li>• Paylaşılan linkler salt okunur erişim sağlar</li>
              <li>• Linkleri istediğiniz zaman aktif/pasif yapabilirsiniz</li>
              <li>• Son kullanma tarihi belirlemek isteğe bağlıdır</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
