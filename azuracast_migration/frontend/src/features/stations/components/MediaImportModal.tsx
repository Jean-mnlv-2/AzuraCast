import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, Check, AlertCircle, Table as TableIcon, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from '../../../api/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface MediaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MediaImportModal: React.FC<MediaImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [importStatus, setImportStatus] = useState<'idle' | 'mapping' | 'processing' | 'success' | 'error'>('idle');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ created: number, updated: number } | null>(null);
  const pollingInterval = useRef<any>(null);

  const REQUIRED_FIELDS = [
    { key: 'path', label: 'Chemin du fichier (obligatoire)', examples: 'path, file, filename' },
    { key: 'title', label: 'Titre', examples: 'title, Titre, Name' },
    { key: 'artist', label: 'Artiste', examples: 'artist, Artiste' },
    { key: 'album', label: 'Album', examples: 'album' },
    { key: 'genre', label: 'Genre', examples: 'genre' },
    { key: 'isrc', label: 'ISRC', examples: 'isrc' },
  ];

  const autoMapColumns = useCallback((sheetHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    sheetHeaders.forEach(header => {
      const h = header.toLowerCase().trim();
      if (['path', 'file', 'fichier', 'filename', 'filepath'].includes(h)) mapping['path'] = header;
      if (['title', 'titre', 'name', 'nom'].includes(h)) mapping['title'] = header;
      if (['artist', 'artiste'].includes(h)) mapping['artist'] = header;
      if (['album'].includes(h)) mapping['album'] = header;
      if (['genre'].includes(h)) mapping['genre'] = header;
      if (['isrc'].includes(h)) mapping['isrc'] = header;
    });
    setColumnMapping(mapping);
  }, []);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const sheetHeaders = (jsonData[0] as any[]).filter(h => h != null).map(String);
          const sheetRows = jsonData.slice(1).map((row: any) => {
            const obj: any = {};
            sheetHeaders.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          setHeaders(sheetHeaders);
          setPreviewData(sheetRows.slice(0, 5));
          (window as any)._fullImportData = sheetRows;
          autoMapColumns(sheetHeaders);
          setImportStatus('mapping');
        }
      } catch (err) {
        setError("Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un fichier Excel ou CSV valide.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [autoMapColumns]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      setError(t('media.import.error_invalid_file'));
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    parseFile(selectedFile);
  }, [t, parseFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const startPolling = (id: string) => {
    setImportStatus('processing');
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`/stations/${station_short_name}/media/import-status/${id}/`);
        const { state, meta, result: taskResult } = response.data;

        if (state === 'PROGRESS') {
          setProgress(meta.progress || 0);
        } else if (state === 'SUCCESS') {
          clearInterval(pollingInterval.current);
          setImportStatus('success');
          setResult({ created: taskResult.created, updated: taskResult.updated });
          setProgress(100);
        } else if (state === 'FAILURE') {
          clearInterval(pollingInterval.current);
          setImportStatus('error');
          setError(t('media.import.error_failed'));
        }
      } catch {
        clearInterval(pollingInterval.current);
        setImportStatus('error');
        setError(t('media.import.error_network'));
      }
    }, 2000); // Polling toutes les 2 secondes
  };

  const handleImport = async () => {
    const rawData = (window as any)._fullImportData;
    if (!rawData || rawData.length === 0) return;

    // Appliquer le mappage des colonnes
    const data = rawData.map((row: any) => {
      const mappedRow: any = {};
      Object.entries(columnMapping).forEach(([targetKey, sourceHeader]) => {
        if (sourceHeader) {
          mappedRow[targetKey] = row[sourceHeader];
        }
      });
      return mappedRow;
    }).filter((row: any) => row.path); // S'assurer que le chemin est présent

    if (data.length === 0) {
      setError("Aucune donnée valide trouvée après mappage. La colonne 'Chemin' est obligatoire.");
      return;
    }

    try {
        setImportStatus('processing');
        const response = await axios.post(`/stations/${station_short_name}/media/import/`, data);
        if (response.data.task_id) {
          startPolling(response.data.task_id);
        }
      } catch {
        setImportStatus('error');
        setError(t('media.import.error_start'));
      }
    };
  
    useEffect(() => {
      return () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
      };
    }, []);
  
    const reset = () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      setFile(null);
      setPreviewData([]);
      setHeaders([]);
      setError(null);
      setImportStatus('idle');
      setProgress(0);
      setResult(null);
      delete (window as any)._fullImportData;
    };

  const handleClose = () => {
    if (importStatus === 'processing') return;
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('media.import.title')}
      size="xl"
    >
      <div className="p-1">
        {importStatus === 'idle' && !file && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-4 p-5 text-center transition-all cursor-pointer ${
              isDragActive ? 'border-primary bg-primary-soft' : 'border-white-soft bg-light-soft hover-bg-light'
            }`}
          >
            <input {...getInputProps()} />
            <div className="bg-white shadow-sm rounded-circle d-inline-flex p-3 mb-3">
              <Upload size={32} className="text-primary" />
            </div>
            <h5 className="fw-800 text-main mb-2">{t('media.import.drop_title')}</h5>
            <p className="text-muted-soft mb-0">{t('media.import.drop_formats')}</p>
          </div>
        )}

        {(file || importStatus !== 'idle') && (
          <div className="bw-section p-0 overflow-hidden border">
            <div className="p-3 bg-light-soft border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary-soft text-primary p-2 rounded-3">
                  <FileText size={20} />
                </div>
                <div>
                  <h6 className="fw-700 text-main mb-0">{file?.name || 'Importation en cours'}</h6>
                  <span className="smaller text-muted-soft fw-600">
                    {importStatus === 'processing' ? `Traitement : ${progress}%` : `${headers.length} colonnes détectées`}
                  </span>
                </div>
              </div>
              {importStatus === 'idle' && (
                <Button variant="light" size="sm" onClick={reset} icon={<X size={16} />}>
                  Changer
                </Button>
              )}
            </div>

            <div className="p-4">
              {error && (
                <div className="alert alert-danger-soft d-flex align-items-center gap-2 mb-4 border-0">
                  <AlertCircle size={18} />
                  <span className="small fw-600">{error}</span>
                </div>
              )}

              {importStatus === 'processing' ? (
                <div className="py-5 text-center">
                  <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
                  <h5 className="fw-800 text-main mb-3">Importation en cours...</h5>
                  <div className="progress bg-light-soft max-width-md mx-auto" style={{ height: '12px', borderRadius: '6px' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-muted-soft fw-600">{progress}% terminé</p>
                </div>
              ) : importStatus === 'success' ? (
                <div className="py-5 text-center">
                  <div className="bg-success-soft text-success rounded-circle d-inline-flex p-4 mb-4">
                    <Check size={48} />
                  </div>
                  <h4 className="fw-800 text-main mb-2">Importation terminée !</h4>
                  <p className="text-muted-soft mb-4">
                    {result?.created} nouveaux médias créés et {result?.updated} mis à jour.
                  </p>
                  <Button variant="success" onClick={handleClose}>Fermer</Button>
                </div>
              ) : importStatus === 'mapping' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                    <TableIcon size={20} />
                    <h5 className="fw-800 mb-0">Configuration du mappage des colonnes</h5>
                  </div>
                  
                  <p className="text-muted-soft small mb-4 fw-600">
                    Associez les colonnes de votre fichier aux champs correspondants dans BantuWave.
                  </p>

                  <div className="row g-4 mb-5">
                    {REQUIRED_FIELDS.map((field) => (
                      <div key={field.key} className="col-md-6">
                        <label className="form-label smaller fw-800 text-uppercase ls-1 text-muted-soft">
                          {field.label}
                        </label>
                        <select 
                          className={`form-select bg-surface border-0 shadow-none ${!columnMapping[field.key] && field.key === 'path' ? 'is-invalid border-danger' : ''}`}
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                        >
                          <option value="">-- Ignorer ce champ --</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="smaller text-muted-soft opacity-70 mt-1 d-block">Exemples : {field.examples}</span>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <TableIcon size={18} />
                    <h6 className="fw-800 mb-0">Prévisualisation (premières lignes)</h6>
                  </div>
                  <div className="table-responsive rounded-4 border overflow-hidden mb-4">
                    <table className="table table-sm mb-0">
                      <thead className="bg-light-soft border-bottom">
                        <tr>
                          {headers.map((h) => (
                            <th key={h} className="px-3 py-2 smaller fw-800 text-uppercase ls-1 text-main">
                              {h}
                              {Object.values(columnMapping).includes(h) && (
                                <span className="ms-2 badge bg-primary-soft text-primary">Mappé</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="hover-bg-light-soft transition-all">
                            {headers.map((h) => <td key={h} className="px-3 py-2 small text-muted-soft">{row[h] || '-'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-end gap-3 pt-3 border-top mt-4">
                    <Button variant="light" onClick={reset}>Annuler</Button>
                    <Button 
                      variant="danger" 
                      onClick={handleImport}
                      disabled={!columnMapping['path']}
                      icon={<Check size={18} />}
                    >
                      Démarrer l'importation
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {error && (
          <div className="alert bg-danger-soft border-0 mt-3 d-flex gap-3 align-items-center rounded-3">
            <AlertCircle size={20} className="text-danger flex-shrink-0" />
            <div className="small text-danger fw-600">{error}</div>
          </div>
        )}

        {importStatus === 'idle' && file && (
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleImport} icon={<Check size={18} />}>
              Lancer l'importation
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MediaImportModal;
