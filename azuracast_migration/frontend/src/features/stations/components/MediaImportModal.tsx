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
  
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ created: number, updated: number } | null>(null);
  
  const pollingInterval = useRef<any>(null);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Conversion en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const sheetHeaders = jsonData[0] as string[];
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
        }
      } catch (err) {
        setError(t('media.import.error_parsing'));
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [t]);

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
    const data = (window as any)._fullImportData;
    if (!data || data.length === 0) return;

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
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <TableIcon size={18} />
                    <h6 className="fw-800 mb-0">Prévisualisation des données</h6>
                  </div>
                  <div className="table-responsive rounded-3 border">
                    <table className="table table-sm mb-0">
                      <thead className="bg-light-soft">
                        <tr>
                          {headers.map((h) => <th key={h} className="px-3 py-2 smaller fw-700 text-uppercase ls-1">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx}>
                            {headers.map((h) => <td key={h} className="px-3 py-2 small text-muted-soft">{row[h] || '-'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
