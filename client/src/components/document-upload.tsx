import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, Trash2, Eye, ChevronDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DocumentsByType, Document } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DocumentUploadProps {
  tirId: string;
  documentsByType: DocumentsByType;
}

const fileTypeOptions = [
  { value: "T1", label: "T1" },
  { value: "CMR", label: "CMR" },
  { value: "Invoice", label: "Fatura" },
  { value: "Doctor", label: "Doktor Kağıdı" },
  { value: "TurkishInvoice", label: "Türk Faturası" },
  { value: "Other", label: "Diğer Belgeler" },
];

const categoryTitles: Record<string, string> = {
  T1: "T1 Belgeleri",
  CMR: "CMR Belgeleri",
  Invoice: "Faturalar",
  Doctor: "Doktor Kağıtları",
  TurkishInvoice: "Türk Faturaları",
  Other: "Diğer Belgeler",
};

export default function DocumentUpload({ tirId, documentsByType }: DocumentUploadProps) {
  const [selectedFileType, setSelectedFileType] = useState<string>("Other");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/tirs/${tirId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Belge yüklenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Belge başarıyla yüklendi",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tirs/${tirId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tirs"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Belge başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tirs/${tirId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tirs"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Belge silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", selectedFileType);
      uploadMutation.mutate(formData);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

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

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm("Bu belgeyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(documentId);
    }
  };

  const totalDocuments = Object.values(documentsByType).flat().length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Belge Yükle</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Belge Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Belge Kategorisi
            </label>
            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fileTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-slate-300 hover:border-primary/50 bg-slate-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">
              Belge yüklemek için tıklayın veya sürükleyip bırakın
            </p>
            <p className="text-xs text-slate-500">
              PDF veya resim dosyaları (Maks. 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
              <span className="text-sm text-primary">Belge yükleniyor...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Belgeler</CardTitle>
            <Badge variant="secondary">Toplam {totalDocuments} belge</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {totalDocuments === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz belge yok</h3>
              <p className="text-slate-600">Yukarıdaki form ile belge yüklemeye başlayın</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(documentsByType)
                .filter(([, documents]) => documents.length > 0)
                .map(([category, documents]) => (
                  <AccordionItem
                    key={category}
                    value={category}
                    className="border border-slate-200 rounded-lg"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-slate-600 mr-2" />
                        <span className="font-medium text-slate-800">
                          {categoryTitles[category]}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {documents.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-white rounded border border-slate-100"
                          >
                            <div className="flex items-center">
                              <span className="text-xl mr-3">{getFileIcon(doc.fileName)}</span>
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(doc.uploadDate), "dd.MM.yyyy, HH:mm", { locale: tr })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.cloudinaryUrl, '_blank')}
                                title="Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deleteMutation.isPending}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
    </div>
  );
}
