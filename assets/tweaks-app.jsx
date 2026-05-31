/* CIA — Panel de Tweaks (isla React sobre la web HTML) */
const CIA_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "titulares": "Newsreader",
  "texto": "Hanken Grotesk",
  "acento": "#5ec89c",
  "señal": true,
  "carrusel": true,
  "entradas": true
}/*EDITMODE-END*/;

const SERIF_STACKS = {
  "Newsreader": "'Newsreader', Georgia, serif",
  "Spectral": "'Spectral', Georgia, serif",
  "Libre Caslon": "'Libre Caslon Text', Georgia, serif"
};
const SANS_STACKS = {
  "Hanken Grotesk": "'Hanken Grotesk', system-ui, sans-serif",
  "Figtree": "'Figtree', system-ui, sans-serif",
  "Schibsted": "'Schibsted Grotesk', system-ui, sans-serif"
};

function CIATweaks(){
  const [t, setTweak] = useTweaks(CIA_TWEAK_DEFAULTS);
  const C = () => (window.CIA || {});

  React.useEffect(()=>{ C().setFont && C().setFont('serif', SERIF_STACKS[t["titulares"]] || SERIF_STACKS.Newsreader); }, [t["titulares"]]);
  React.useEffect(()=>{ C().setFont && C().setFont('sans', SANS_STACKS[t["texto"]] || SANS_STACKS["Hanken Grotesk"]); }, [t["texto"]]);
  React.useEffect(()=>{ C().setAccent && C().setAccent(t["acento"]); }, [t["acento"]]);
  React.useEffect(()=>{ C().setSignal && C().setSignal(!!t["señal"]); }, [t["señal"]]);
  React.useEffect(()=>{ C().setCarousel && C().setCarousel(!!t["carrusel"]); }, [t["carrusel"]]);
  React.useEffect(()=>{ C().setReveal && C().setReveal(!!t["entradas"]); }, [t["entradas"]]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Tipografía" />
      <TweakSelect label="Titulares" value={t["titulares"]}
        options={Object.keys(SERIF_STACKS)}
        onChange={(v)=>setTweak("titulares", v)} />
      <TweakSelect label="Texto" value={t["texto"]}
        options={Object.keys(SANS_STACKS)}
        onChange={(v)=>setTweak("texto", v)} />

      <TweakSection label="Color de marca" />
      <TweakColor label="Acento" value={t["acento"]}
        options={["#5ec89c","#43d49a","#2fb37e","#7fd8c2"]}
        onChange={(v)=>setTweak("acento", v)} />

      <TweakSection label="Animaciones" />
      <TweakToggle label="Señal del campo" value={t["señal"]}
        onChange={(v)=>setTweak("señal", v)} />
      <TweakToggle label="Carrusel automático" value={t["carrusel"]}
        onChange={(v)=>setTweak("carrusel", v)} />
      <TweakToggle label="Entradas al hacer scroll" value={t["entradas"]}
        onChange={(v)=>setTweak("entradas", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<CIATweaks/>);
