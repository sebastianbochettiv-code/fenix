import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  loadPlantillas,
  savePlantillas,
  type Plantilla,
} from './SettingsMagoChicIAPlantillas';

const STORAGE_KEY_AGENTES = 'fenix_agentes_ia';

type Agente = {
  id: string;
  nombre: string;
  proveedor: string;
  modelo: string;
  apiKey: string;
  apiBaseUrl: string;
  sistemaPrompt: string;
};

const loadAgentes = (): Agente[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_AGENTES) ?? '[]');
  } catch {
    return [];
  }
};

const SISTEMA_PROMPT_DISENO = `Eres un diseñador experto de documentos HTML5 corporativos.

Cuando el usuario pida crear o modificar un documento, responde ÚNICAMENTE con el código HTML5 completo y autocontenido:
- Empieza con <!DOCTYPE html> y termina con </html>
- Todos los estilos van en <style> dentro del <head>
- Diseñado para formato carta (816px de ancho, mínimo 1056px de alto)
- Diseño profesional, limpio, corporativo, con tipografías modernas
- Si ya existe un documento y el usuario pide cambios, regenera el HTML completo con los cambios aplicados
- Usa variables CSS para colores corporativos fáciles de personalizar

Para preguntas conceptuales o aclaraciones, puedes responder con texto normal.`;

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  isLoading?: boolean;
};

const isHtmlContent = (text: string): boolean => {
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype html') || t.startsWith('<html');
};

const streamAI = async ({
  proveedor,
  modelo,
  apiKey,
  apiBaseUrl,
  sistemaPrompt,
  messages,
  onChunk,
  onDone,
  onError,
}: {
  proveedor: string;
  modelo: string;
  apiKey: string;
  apiBaseUrl?: string;
  sistemaPrompt: string;
  messages: { role: string; content: string }[];
  onChunk: (chunk: string) => void;
  onDone: (full: string) => void;
  onError: (err: string) => void;
}) => {
  try {
    let url: string;
    let headers: Record<string, string>;
    let body: object;

    if (proveedor === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      };
      body = {
        model: modelo,
        max_tokens: 8192,
        stream: true,
        system: sistemaPrompt,
        messages,
      };
    } else {
      url =
        proveedor === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : proveedor === 'xai'
            ? 'https://api.x.ai/v1/chat/completions'
            : proveedor === 'otro' && apiBaseUrl
              ? `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`
              : 'https://api.openai.com/v1/chat/completions';
      headers = {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      };
      body = {
        model: modelo,
        stream: true,
        messages: [{ role: 'system', content: sistemaPrompt }, ...messages],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      onError(`Error ${response.status}: ${errText.substring(0, 300)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError('Sin cuerpo de respuesta'); return; }

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          let text = '';
          if (proveedor === 'anthropic') {
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              text = parsed.delta.text ?? '';
            }
          } else {
            text = parsed.choices?.[0]?.delta?.content ?? '';
          }
          if (text) { full += text; onChunk(text); }
        } catch { /* skip */ }
      }
    }

    onDone(full);
  } catch (err: any) {
    onError(err?.message ?? 'Error desconocido');
  }
};

export const SettingsMagoChicIAPlantillaDiseno = () => {
  const { plantillaId } = useParams<{ plantillaId: string }>();
  const navigate = useNavigate();

  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [nombre, setNombre] = useState('');
  const [html, setHtml] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgenteId, setSelectedAgenteId] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const [streamingHtml, setStreamingHtml] = useState('');
  const [saved, setSaved] = useState(false);

  const streamingRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const all = loadPlantillas();
    const found = all.find((p) => p.id === plantillaId) ?? null;
    setPlantilla(found);
    if (found && !initialized.current) {
      initialized.current = true;
      setNombre(found.nombre);
      setHtml(found.html);
      try {
        const parsed = JSON.parse(found.historialChat ?? '[]');
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch { /* empty */ }
    }

    const loadedAgentes = loadAgentes();
    setAgentes(loadedAgentes);
    if (loadedAgentes.length > 0) setSelectedAgenteId(loadedAgentes[0].id);
  }, [plantillaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSave = (overrideNombre?: string, overrideHtml?: string, overrideMsgs?: ChatMsg[]) => {
    if (!plantillaId) return;
    const all = loadPlantillas();
    const updated = all.map((p) =>
      p.id === plantillaId
        ? {
            ...p,
            nombre: overrideNombre ?? nombre,
            html: overrideHtml ?? html,
            historialChat: JSON.stringify(
              (overrideMsgs ?? messages).filter((m) => !m.isLoading),
            ),
            updatedAt: new Date().toISOString(),
          }
        : p,
    );
    savePlantillas(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const agente = agentes.find((a) => a.id === selectedAgenteId);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !agente) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: text };
    const loadingMsg: ChatMsg = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    const nextMessages = [...messages, userMsg, loadingMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    streamingRef.current = '';

    const historyForAI = [
      ...messages
        .filter((m) => !m.isLoading)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.isHtml ? '[HTML del documento anterior]' : m.content,
        })),
      { role: 'user' as const, content: text },
    ];

    const extraPrompt = agente.sistemaPrompt ? `\n\n${agente.sistemaPrompt}` : '';

    await streamAI({
      proveedor: agente.proveedor,
      modelo: agente.modelo,
      apiKey: agente.apiKey,
      apiBaseUrl: agente.apiBaseUrl,
      sistemaPrompt: SISTEMA_PROMPT_DISENO + extraPrompt,
      messages: historyForAI,
      onChunk: (chunk) => {
        streamingRef.current += chunk;
        setStreamingHtml(streamingRef.current);
      },
      onDone: (full) => {
        const isHtml = isHtmlContent(full);
        const newHtml = isHtml ? full : html;
        if (isHtml) {
          setHtml(full);
          setStreamingHtml('');
        }

        const assistantMsg: ChatMsg = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: isHtml ? '✓ Documento generado. Revisalo en el preview.' : full,
          isHtml,
        };

        const finalMessages = [
          ...nextMessages.filter((m) => !m.isLoading),
          assistantMsg,
        ];
        setMessages(finalMessages);
        setLoading(false);
        streamingRef.current = '';

        // auto-save tras cada generación
        handleSave(nombre, newHtml, finalMessages);
      },
      onError: (err) => {
        const errMsg: ChatMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err}`,
        };
        const finalMessages = [...nextMessages.filter((m) => !m.isLoading), errMsg];
        setMessages(finalMessages);
        setLoading(false);
        setStreamingHtml('');
        streamingRef.current = '';
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayHtml = streamingHtml || html;

  const emptyPreview = `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#bbb;">
    <div style="text-align:center"><div style="font-size:48px;margin-bottom:12px">📄</div><div>El documento generado aparecerá aquí</div></div>
  </body></html>`;

  if (!plantilla) {
    return (
      <SubMenuTopBarContainer title="Plantilla no encontrada" links={[]}>
        <div style={{ padding: 32, color: '#999' }}>
          No se encontró la plantilla.{' '}
          <button
            className="mgc-ve-btn-secondary"
            onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicIAPlantillas))}
          >
            Volver
          </button>
        </div>
      </SubMenuTopBarContainer>
    );
  }

  return (
    <SubMenuTopBarContainer
      title={nombre || 'Diseño de Plantilla'}
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'IA', href: getSettingsPath(SettingsPath.MagoChicIAAgentes) },
        { children: 'Plantillas', href: getSettingsPath(SettingsPath.MagoChicIAPlantillas) },
        { children: nombre || 'Diseño' },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px', borderBottom: '1px solid var(--t-border-color-medium, #e5e7eb)',
          flexShrink: 0,
        }}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => handleSave()}
            placeholder="Nombre de la plantilla..."
            style={{
              flex: 1, border: '1px solid var(--t-border-color-medium, #e5e7eb)',
              borderRadius: 6, padding: '6px 10px', fontSize: 14, outline: 'none',
              background: 'var(--t-background-primary, #fff)',
              color: 'var(--t-font-color, #111)',
            }}
          />
          <select
            value={selectedAgenteId}
            onChange={(e) => setSelectedAgenteId(e.target.value)}
            style={{
              border: '1px solid var(--t-border-color-medium, #e5e7eb)',
              borderRadius: 6, padding: '6px 10px', fontSize: 13,
              background: 'var(--t-background-primary, #fff)',
              color: 'var(--t-font-color, #111)',
              cursor: 'pointer',
            }}
          >
            {agentes.length === 0 && (
              <option value="">— sin agentes configurados —</option>
            )}
            {agentes.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} ({a.modelo})</option>
            ))}
          </select>
          <button
            onClick={() => handleSave()}
            style={{
              background: saved ? '#16a34a' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 6,
              padding: '6px 16px', fontSize: 13, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
          <button
            onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicIAPlantillas))}
            style={{
              background: 'transparent',
              border: '1px solid var(--t-border-color-medium, #e5e7eb)',
              borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
              color: 'var(--t-font-color, #111)',
            }}
          >
            ← Volver
          </button>
        </div>

        {/* Main panel */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* LEFT: Chat */}
          <div style={{
            width: '36%', minWidth: 280, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid var(--t-border-color-medium, #e5e7eb)',
          }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
              {messages.length === 0 && !loading && (
                <div style={{
                  textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 13,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                  Describí el documento que querés crear.<br />
                  <span style={{ fontSize: 11 }}>Ej: &quot;Presupuesto corporativo con tabla de ítems, logo arriba y total en azul&quot;</span>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: msg.role === 'user' ? '#2563eb' : 'var(--t-background-secondary, #f5f5f5)',
                      color: msg.role === 'user' ? '#fff' : 'var(--t-font-color, #111)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      border: msg.role === 'assistant' ? '1px solid var(--t-border-color-medium, #e5e7eb)' : 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    {msg.isLoading ? (
                      <span style={{ color: '#9ca3af' }}>
                        Generando
                        {streamingHtml && (
                          <span style={{ fontSize: 10, marginLeft: 6, color: '#6b7280' }}>
                            {streamingHtml.length} chars…
                          </span>
                        )}
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--t-border-color-medium, #e5e7eb)',
            }}>
              {agentes.length === 0 && (
                <div style={{
                  fontSize: 12, color: '#ef4444', marginBottom: 8,
                  padding: '6px 10px', background: '#fef2f2', borderRadius: 6,
                }}>
                  Configurá un agente en IA → Agentes primero.
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describí lo que querés... (Enter para enviar)"
                  disabled={loading || agentes.length === 0}
                  rows={2}
                  style={{
                    flex: 1,
                    border: '1px solid var(--t-border-color-medium, #e5e7eb)',
                    borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'none',
                    outline: 'none', fontFamily: 'inherit',
                    background: 'var(--t-background-primary, #fff)',
                    color: 'var(--t-font-color, #111)',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim() || agentes.length === 0}
                  style={{
                    background: '#2563eb', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                    fontSize: 18, lineHeight: 1, flexShrink: 0,
                    opacity: loading || !input.trim() ? 0.5 : 1,
                  }}
                >
                  ↑
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                Shift+Enter para salto de línea · Auto-guardado al generar
              </div>
            </div>
          </div>

          {/* RIGHT: Console + Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Console toggle */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 14px', background: '#1e1e2e', color: '#cdd6f4',
                fontSize: 12, cursor: 'pointer', flexShrink: 0, userSelect: 'none',
              }}
              onClick={() => setShowConsole((v) => !v)}
            >
              <span>
                <span style={{ opacity: 0.6 }}>{'</>'}</span>
                {' '}Código HTML
                {displayHtml && (
                  <span style={{ marginLeft: 8, opacity: 0.5 }}>
                    ({displayHtml.length.toLocaleString()} chars)
                  </span>
                )}
              </span>
              <span style={{ opacity: 0.6 }}>{showConsole ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </div>

            {showConsole && (
              <div style={{ height: '28%', background: '#1e1e2e', overflowY: 'auto', flexShrink: 0 }}>
                <pre style={{
                  margin: 0, padding: '12px 16px', fontSize: 11,
                  fontFamily: 'monospace', color: '#cdd6f4', whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {displayHtml || '// El HTML generado aparecerá aquí...'}
                </pre>
              </div>
            )}

            {/* Preview carta */}
            <div style={{
              flex: 1, overflow: 'auto', background: '#e5e7eb',
              padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            }}>
              <div style={{
                background: '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                width: 816, minHeight: 1056, flexShrink: 0,
              }}>
                <iframe
                  srcDoc={html || emptyPreview}
                  style={{ width: '100%', minHeight: 1056, border: 'none', display: 'block' }}
                  title="preview-carta"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubMenuTopBarContainer>
  );
};
