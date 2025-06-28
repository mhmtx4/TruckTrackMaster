import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Save, Phone, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { insertTirSchema, Tir } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TirFormProps {
  tir?: Tir;
  isNew: boolean;
}

export default function TirForm({ tir, isNew }: TirFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTirSchema),
    defaultValues: {
      phone: tir?.phone || "",
      plate: tir?.plate || "",
      trailerPlate: tir?.trailerPlate || "",
      location: tir?.location || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tirs", data);
      return response.json();
    },
    onSuccess: (newTir) => {
      toast({
        title: "Başarılı",
        description: "TIR profili başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tirs"] });
      setLocation(`/tir/${newTir.id}`);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "TIR profili oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/tirs/${tir!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "TIR profili başarıyla güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tirs/${tir!.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tirs"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "TIR profili güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Temel Bilgiler</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Telefon Numarası <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+90 532 123 4567"
                {...form.register("phone")}
                className={form.formState.errors.phone ? "border-red-500" : ""}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="plate">
                <Truck className="h-4 w-4 mr-2 inline" />
                Plaka
              </Label>
              <Input
                id="plate"
                placeholder="34 ABC 123"
                {...form.register("plate")}
              />
            </div>

            <div>
              <Label htmlFor="trailerPlate">
                <Truck className="h-4 w-4 mr-2 inline" />
                Treyler Plakası
              </Label>
              <Input
                id="trailerPlate"
                placeholder="34 TR 456"
                {...form.register("trailerPlate")}
              />
            </div>

            <div>
              <Label htmlFor="location">
                <MapPin className="h-4 w-4 mr-2 inline" />
                Lokasyon
              </Label>
              <Input
                id="location"
                placeholder="İstanbul, Türkiye"
                {...form.register("location")}
              />
            </div>

            {!isNew && tir && (
              <div>
                <Label>Son Güncelleme</Label>
                <Input
                  value={format(new Date(tir.lastUpdated), "dd.MM.yyyy, HH:mm:ss", { locale: tr })}
                  readOnly
                  className="bg-slate-50 text-slate-600"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isNew ? "Oluşturuluyor..." : "Kaydediliyor..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? "TIR Profili Oluştur" : "Değişiklikleri Kaydet"}
              </>
            )}
          </Button>
        </div>

        {/* Information Card */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Bilgilendirme</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Gerekli Alanlar</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Telefon numarası zorunludur</li>
                    <li>• Diğer tüm alanlar isteğe bağlıdır</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Öneriler</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Telefon numarasını uluslararası formatta girin</li>
                    <li>• Plaka bilgilerini net bir şekilde yazın</li>
                    <li>• Lokasyon bilgisi takip için faydalıdır</li>
                  </ul>
                </div>

                {!isNew && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">Not</h4>
                    <p className="text-sm text-slate-600">
                      Profil bilgileri değiştirildiğinde "Son güncelleme" zamanı otomatik olarak güncellenecektir.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
