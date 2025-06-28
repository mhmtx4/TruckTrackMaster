import { Link } from "wouter";
import { Truck, MapPin, Phone, FileText, Calendar, Edit, Share2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TirWithDocuments } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface TirCardProps {
  tir: TirWithDocuments & { documentCount: number };
}

export default function TirCard({ tir }: TirCardProps) {
  const cardColors = [
    "bg-primary/10 text-primary",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-rose-100 text-rose-700",
  ];

  const colorIndex = Math.abs(tir.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % cardColors.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cardColors[colorIndex]}`}>
              <Truck className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-slate-800">{tir.phone}</h3>
              <p className="text-sm text-slate-600">
                {tir.plate || "Plaka belirtilmemiş"}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Link href={`/tir/${tir.id}`}>
              <Button variant="ghost" size="sm" title="Düzenle">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" title="Paylaş">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 text-slate-400 mr-2" />
            <span className="text-slate-600">{tir.phone}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 text-slate-400 mr-2" />
            <span className="text-slate-600">
              {tir.location || "Lokasyon belirtilmemiş"}
            </span>
          </div>
          {tir.trailerPlate && (
            <div className="flex items-center text-sm">
              <Truck className="h-4 w-4 text-slate-400 mr-2" />
              <span className="text-slate-600">{tir.trailerPlate}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <FileText className="h-4 w-4 text-slate-400 mr-2" />
            <span className="text-slate-600">{tir.documentCount} belge</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Son güncelleme:</span>
            </div>
            <div className="font-medium text-slate-700 mt-1">
              {formatDistanceToNow(new Date(tir.lastUpdated), { 
                addSuffix: true, 
                locale: tr 
              })}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/tir/${tir.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-3 w-3 mr-1" />
                Görüntüle
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
