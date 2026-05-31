"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

// Signal Canvas Component
function SignalCanvas({ id, className }: { id: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const ACCENT = { r: 94, g: 200, b: 156 }
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches

    const sensors =
      id === "hero-canvas"
        ? [
            { x: 0.1, y: 0.46, label: null, val: "", phase: 0 },
            { x: 0.3, y: 0.74, label: null, val: "", phase: 1.4 },
            { x: 0.2, y: 0.3, label: null, val: "", phase: 2.6 },
          ]
        : [
            { x: 0.18, y: 0.42, label: "HUMEDAD", val: "32%", phase: 0 },
            { x: 0.5, y: 0.66, label: "RIEGO", val: "ON", phase: 1.1 },
            { x: 0.78, y: 0.34, label: "DRON", val: "14:20", phase: 2.2 },
            { x: 0.66, y: 0.8, label: "NDVI", val: "0.74", phase: 0.6 },
            { x: 0.36, y: 0.2, label: "SENSOR", val: "A-07", phase: 1.7 },
          ]

    const showLabels = id !== "hero-canvas"
    const maxR = id === "hero-canvas" ? 0.5 : 0.26
    let W = 0,
      H = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let t0 = performance.now()
    let running = true

    function C(a: number) {
      return `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${a})`
    }
    function CS() {
      return `rgb(${ACCENT.r},${ACCENT.g},${ACCENT.b})`
    }

    function resize() {
      const r = canvas!.getBoundingClientRect()
      W = r.width
      H = r.height
      canvas!.width = Math.max(1, W * DPR)
      canvas!.height = Math.max(1, H * DPR)
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    function px(s: { x: number; y: number }) {
      return { x: s.x * W, y: s.y * H }
    }

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      c.beginPath()
      c.moveTo(x + r, y)
      c.arcTo(x + w, y, x + w, y + h, r)
      c.arcTo(x + w, y + h, x, y + h, r)
      c.arcTo(x, y + h, x, y, r)
      c.arcTo(x, y, x + w, y, r)
      c.closePath()
    }

    function draw(now: number) {
      if (!running) return
      const t = (now - t0) / 1000
      ctx!.clearRect(0, 0, W, H)
      ctx!.lineWidth = 1

      for (let i = 0; i < sensors.length; i++) {
        for (let j = i + 1; j < sensors.length; j++) {
          const a = px(sensors[i]),
            b = px(sensors[j])
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d > Math.min(W, H) * 0.52) continue
          const pulse = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.7 + i + j))
          ctx!.strokeStyle = C(pulse)
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      const period = 3.2
      sensors.forEach((s, si) => {
        const p = px(s)
        const local = ((t + s.phase) % period) / period
        const maxRadius = Math.min(W, H) * maxR

        for (let k = 0; k < 2; k++) {
          let prog = local - k * 0.5
          if (prog < 0) prog += 1
          const r = prog * maxRadius
          const alpha = (1 - prog) * 0.5
          if (alpha <= 0) continue
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx!.strokeStyle = C(alpha)
          ctx!.lineWidth = 1.5
          ctx!.stroke()
        }

        ;[4, 9].forEach((rr) => {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, rr, 0, Math.PI * 2)
          ctx!.strokeStyle = C(0.55)
          ctx!.lineWidth = 1.2
          ctx!.stroke()
        })

        const dp = 2.6 + 1.2 * (0.5 + 0.5 * Math.sin(t * 2.4 + si))
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, dp, 0, Math.PI * 2)
        ctx!.fillStyle = CS()
        ctx!.fill()
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, dp + 3, 0, Math.PI * 2)
        ctx!.fillStyle = C(0.18)
        ctx!.fill()

        if (showLabels && s.label) {
          const lx = p.x + 16,
            ly = p.y - 10
          ctx!.font = '600 11px "Space Mono", monospace'
          const txt = s.label + " " + s.val
          const w = ctx!.measureText(txt).width
          ctx!.fillStyle = "rgba(13,29,22,0.62)"
          roundRect(ctx!, lx - 7, ly - 13, w + 14, 21, 5)
          ctx!.fill()
          ctx!.fillStyle = CS()
          ctx!.textBaseline = "middle"
          ctx!.fillText(s.label, lx, ly - 1.5)
          ctx!.fillStyle = "#f4f1e9"
          ctx!.fillText(" ".repeat(s.label.length + 1) + s.val, lx, ly - 1.5)
          ctx!.strokeStyle = C(0.5)
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(lx - 7, ly + 8)
          ctx!.stroke()
        }
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener("resize", resize)

    if (!reduce) {
      rafRef.current = requestAnimationFrame(draw)
    } else {
      running = true
      draw(performance.now())
      running = false
    }

    return () => {
      running = false
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [id])

  return <canvas ref={canvasRef} id={id} className={className} />
}

// Carousel Component
function Carousel() {
  const slides = [
    { src: "/assets/hub-1.jpg", alt: "Sala de trabajo del Hub bajo cubierta de vigas restauradas" },
    { src: "/assets/hub-4.jpg", alt: "Mesa de trabajo corrida del Hub con luz natural" },
    { src: "/assets/hub-2.jpg", alt: "Rincon office del Hub con cocina y mesa redonda" },
    { src: "/assets/hub-3.jpg", alt: "Sala de reuniones del Hub junto a ventanal de doble hoja" },
    { src: "/assets/hub-6.jpg", alt: "Vista cenital del Hub con la gran mesa de trabajo" },
    { src: "/assets/hub-5.jpg", alt: "Perspectiva del Hub con pantalla de presentaciones al fondo" },
  ]

  const [current, setCurrent] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const progressRef = useRef<NodeJS.Timeout>()

  const startAutoplay = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    let p = 0
    progressRef.current = setInterval(() => {
      p += 1
      setProgress(p)
      if (p >= 100) p = 0
    }, 50)

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
      setProgress(0)
    }, 5000)
  }, [slides.length])

  useEffect(() => {
    startAutoplay()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [startAutoplay])

  const goTo = (idx: number) => {
    setCurrent(idx)
    setProgress(0)
    startAutoplay()
  }

  return (
    <div className="carousel" data-autoplay="5000" aria-label="Galeria del Hub de innovacion">
      <div className="car-track">
        {slides.map((slide, idx) => (
          <figure key={idx} className={`car-slide ${idx === current ? "is-active" : ""}`}>
            <Image src={slide.src} alt={slide.alt} fill style={{ objectFit: "cover" }} />
          </figure>
        ))}
      </div>
      <span className="tag">El Hub - espacio fisico</span>
      <div className="car-count">
        <span className="cur">{String(current + 1).padStart(2, "0")}</span> /{" "}
        <span className="tot">{String(slides.length).padStart(2, "0")}</span>
      </div>
      <div className="car-ui">
        <div className="car-dots" role="tablist">
          {slides.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-label={`Imagen ${idx + 1}`}
              className={idx === current ? "on" : ""}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
        <div className="car-arrows">
          <button className="car-prev" aria-label="Anterior" onClick={() => goTo((current - 1 + slides.length) % slides.length)}>
            {"<-"}
          </button>
          <button className="car-next" aria-label="Siguiente" onClick={() => goTo((current + 1) % slides.length)}>
            {"->"}
          </button>
        </div>
      </div>
      <div className="car-progress" style={{ width: `${progress}%` }} />
    </div>
  )
}

import React from "react"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [navScrolled, setNavScrolled] = React.useState(false)
  const [formSent, setFormSent] = React.useState(false)
  const yearRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (yearRef.current) {
      yearRef.current.textContent = new Date().getFullYear().toString()
    }

    const onScroll = () => {
      setNavScrolled(window.scrollY > 40)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el))

    // Reto progress line
    const retoTrack = document.querySelector(".reto-track")
    if (retoTrack) {
      const prog = retoTrack.querySelector(".reto-line .prog") as HTMLElement
      const rio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (prog) prog.style.width = "100%"
              rio.disconnect()
            }
          })
        },
        { threshold: 0.4 }
      )
      rio.observe(retoTrack)
    }

    return () => {
      window.removeEventListener("scroll", onScroll)
      io.disconnect()
    }
  }, [])

  // FAQ accordion
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  const handleFaqClick = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSent(true)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    document.body.style.overflow = ""
  }

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen
    setMobileMenuOpen(newState)
    document.body.style.overflow = newState ? "hidden" : ""
  }

  return (
    <>
      {/* NAV */}
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        <a className="nav-logo" href="#top" aria-label="Centro de Innovacion Antonete - inicio">
          <Image src="/assets/logo-symbol-white.png" alt="CIA" width={34} height={34} />
          <span className="wm">
            CIA<small>Centro de Innovacion Antonete</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#ecosistema">El proyecto</a>
          <a href="#espacio">El campo</a>
          <a href="#reto">El Reto</a>
          <a href="#tematicas">Tematicas</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-cta">
          <a href="#sumate" className="btn btn-pri">
            Sumate al ecosistema <span className="arw">-&gt;</span>
          </a>
        </div>
        <button
          className={`nav-burger ${mobileMenuOpen ? "x" : ""}`}
          aria-label="Abrir menu"
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <a href="#ecosistema" onClick={closeMobileMenu}>
          El proyecto
        </a>
        <a href="#espacio" onClick={closeMobileMenu}>
          El campo
        </a>
        <a href="#reto" onClick={closeMobileMenu}>
          El Reto
        </a>
        <a href="#tematicas" onClick={closeMobileMenu}>
          Tematicas
        </a>
        <a href="#faq" onClick={closeMobileMenu}>
          FAQ
        </a>
        <a href="#sumate" className="btn btn-pri mm-cta" onClick={closeMobileMenu}>
          Sumate al ecosistema -&gt;
        </a>
      </div>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-bg">
          <Image
            src="/assets/hero-finca.jpg"
            alt="Fachada de la historica Finca Antonete con la carretera de acceso, olivos en maceta y olivar al fondo"
            fill
            style={{ objectFit: "cover", objectPosition: "center 58%" }}
            priority
          />
        </div>
        <SignalCanvas id="hero-canvas" className="hero-signal" />
        <div className="hero-inner">
          <span className="kicker esm reveal">Cluster de innovacion abierta - Sector agroalimentario</span>
          <h1 className="reveal d1">
            Impulsamos la innovacion del sector <em className="em-esm">agroalimentario</em>.
          </h1>
          <p className="lede reveal d2">
            El punto de encuentro donde la tecnologia, las empresas y el campo se conectan para transformar la cadena de
            valor - validado sobre un campo experimental <em>real</em>.
          </p>
          <div className="hero-actions reveal d3">
            <a href="#sumate" className="btn btn-pri">
              Sumate al ecosistema <span className="arw">-&gt;</span>
            </a>
            <a href="#espacio" className="btn btn-ghost">
              Conoce la finca
            </a>
          </div>
          <div className="hero-meta reveal d4">
            <div className="cell">
              <div className="n">
                170<span className="u">ha</span>
              </div>
              <div className="l">En exclusiva para socios</div>
            </div>
            <div className="cell">
              <div className="n">1785</div>
              <div className="l">Hacienda manchega</div>
            </div>
            <div className="cell">
              <div className="n">04</div>
              <div className="l">Pistacho - olivo - almendro - vid</div>
            </div>
            <div className="cell">
              <div className="n">Albacete</div>
              <div className="l">Tarazona de la Mancha</div>
            </div>
          </div>
        </div>
        <div className="scroll-cue">
          <span className="ln"></span>Desplazate
        </div>
      </header>

      {/* ECOSISTEMA */}
      <section className="sec-pad bg-hueso" id="ecosistema">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker esm reveal">Que encontraras aqui</span>
            <h2 className="display-l reveal d1">
              Un punto de encuentro donde la tecnologia <em className="em-esm">baja al campo</em>.
            </h2>
            <p className="lede reveal d2">
              El Centro de Innovacion Antonete conecta tecnologia, empresas y campo para transformar el sector
              agroalimentario. Un mismo lugar donde podras:
            </p>
          </div>
          <div className="cap-grid">
            {[
              { title: "Visualizar tecnologia in situ", desc: "Ver despliegues tecnicos funcionando en un entorno productivo real, no en una demo." },
              { title: "Testear y validar", desc: "Realizar pruebas piloto de nuevas herramientas antes de su lanzamiento al mercado." },
              { title: "Resolver retos", desc: "Plantear necesidades productivas para que el ecosistema desarrolle soluciones a medida." },
              { title: "Formacion", desc: "Acceder a capacitacion especializada en Agricultura 4.0 para directivos y plantillas." },
            ].map((cap, idx) => (
              <div key={idx} className={`cap reveal ${idx > 0 ? `d${idx}` : ""}`}>
                <svg className="ringnum" viewBox="0 0 42 42" fill="none" stroke="#2f8f63">
                  <circle cx="21" cy="21" r="4" strokeWidth="2" />
                  <circle cx="21" cy="21" r="11" strokeWidth="2" opacity=".7" />
                  <path d="M21 3a18 18 0 1 1-12.7 5.3" strokeWidth="2" opacity=".45" />
                </svg>
                <h3>{cap.title}</h3>
                <p>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUE ES EL CIA */}
      <section className="sec-pad bg-bosque">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker oro reveal">Que es el CIA</span>
            <h2 className="display-l reveal d1">
              Cuatro funciones, un mismo <em className="em-esm">ecosistema</em>.
            </h2>
          </div>
          <div className="func-grid">
            {[
              { num: "01", title: "Punto de encuentro", desc: "Hub fisico de reuniones y gestion de proyectos, con espacio para empresas y startups.", icon: "circles" },
              { num: "02", title: "Campo de experiencias", desc: "Living lab de 170 ha para pruebas piloto y validacion en condiciones reales.", icon: "field" },
              { num: "03", title: "Proyectos agrotech", desc: "Identificacion de retos y formacion de consorcios entre empresas, startups y centros.", icon: "network" },
              { num: "04", title: "Talento y formacion", desc: "Capacitacion para directivos y agricultores, y apoyo a startups del sector.", icon: "edu" },
            ].map((func, idx) => (
              <article key={idx} className={`func reveal ${idx > 0 ? `d${idx}` : ""}`}>
                <div className="fnum">{func.num}</div>
                <svg className="fmark" viewBox="0 0 34 34" fill="none" stroke="currentColor">
                  {func.icon === "circles" && (
                    <>
                      <circle cx="17" cy="17" r="3.4" strokeWidth="2" />
                      <circle cx="17" cy="17" r="9" strokeWidth="2" opacity=".6" />
                      <circle cx="17" cy="17" r="15" strokeWidth="2" opacity=".3" />
                    </>
                  )}
                  {func.icon === "field" && (
                    <>
                      <path d="M5 24c4-7 8-11 12-11s8 4 12 11" strokeWidth="2" />
                      <circle cx="17" cy="9" r="3" strokeWidth="2" />
                      <path d="M5 29h24" strokeWidth="2" opacity=".5" />
                    </>
                  )}
                  {func.icon === "network" && (
                    <>
                      <circle cx="9" cy="11" r="3.2" strokeWidth="2" />
                      <circle cx="25" cy="11" r="3.2" strokeWidth="2" />
                      <circle cx="17" cy="25" r="3.2" strokeWidth="2" />
                      <path d="M11 13l5 9M23 13l-5 9M12 11h10" strokeWidth="2" opacity=".55" />
                    </>
                  )}
                  {func.icon === "edu" && (
                    <>
                      <path d="M17 5l12 6-12 6L5 11l12-6Z" strokeWidth="2" />
                      <path d="M9 15v7c0 2 4 4 8 4s8-2 8-4v-7" strokeWidth="2" opacity=".55" />
                    </>
                  )}
                </svg>
                <h3>{func.title}</h3>
                <p>{func.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROPOSITO */}
      <section className="sec-pad bg-hueso">
        <div className="flourish prop" aria-hidden="true">
          <Image src="/assets/flourish-tree.png" alt="" width={460} height={460} />
        </div>
        <div className="wrap">
          <span className="kicker esm reveal">Proposito del programa</span>
          <div className="prop-grid" style={{ marginTop: "36px" }}>
            <p className="statement reveal d1">
              Un cluster con la mision de <em className="em-esm">identificar, compartir e implementar</em>{" "}
              <span className="mut">los retos de innovacion que traen las nuevas tecnologias.</span>
            </p>
            <div className="prop-pills reveal d2">
              <div className="pill">
                <span className="pk">01</span>
                <span className="pt">
                  <b>Innovacion abierta.</b> Un ecosistema colaborativo disenado para la transformacion digital del
                  sector agroalimentario.
                </span>
              </div>
              <div className="pill">
                <span className="pk">02</span>
                <span className="pt">
                  <b>De la necesidad al mercado.</b> Un mismo recorrido: identificar, pilotar y llevar al mercado en el
                  menor tiempo posible.
                </span>
              </div>
              <div className="pill">
                <span className="pk">03</span>
                <span className="pt">
                  <b>Impacto en lo rural.</b> Genera oportunidades de negocio que retienen y atraen talento al medio
                  rural.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EL ESPACIO */}
      <section className="sec-pad bg-bosque" id="espacio">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "clamp(40px,5vw,64px)" }}>
            <span className="kicker oro reveal">El espacio</span>
            <h2 className="display-l reveal d1">
              El Hub de innovacion y la <em className="em-esm">finca de cultivos</em>.
            </h2>
          </div>

          <div className="split reveal" style={{ marginBottom: "clamp(40px,6vw,80px)" }}>
            <Carousel />
            <div className="split-text">
              <span className="kicker esm">01 - Punto de encuentro</span>
              <h3>El Hub de innovacion</h3>
              <p className="body-mut" style={{ fontSize: "17px", maxWidth: "46ch" }}>
                El espacio fisico destinado a reuniones y gestion de proyectos, con areas para empresas y startups,
                donde se desarrollan proyectos, se ejecutan programas de formacion y se comparte conocimiento a traves
                de eventos.
              </p>
              <div className="feat">
                <div className="fi">
                  <span className="dot"></span>
                  <span>Salas de reunion y gestion de proyectos para socios.</span>
                </div>
                <div className="fi">
                  <span className="dot"></span>
                  <span>Equipo tecnico y de campo a disposicion.</span>
                </div>
                <div className="fi">
                  <span className="dot"></span>
                  <span>Maquinaria y aperos compartidos.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="split rev reveal">
            <div className="split-media">
              <span className="tag">El campo - living lab</span>
              <Image
                src="/assets/aerea-cultivos.jpg"
                alt="Vista aerea de las hileras de cultivo de la Finca Antonete"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="split-text">
              <span className="kicker esm">02 - Campo de experiencias</span>
              <h3>El campo de experiencias</h3>
              <p className="body-mut" style={{ fontSize: "17px", maxWidth: "46ch" }}>
                Una finca de cultivos de alto valor -pistachos, almendros, olivos y vides- para realizar pruebas
                piloto, testar tecnologias y validar resultados, con el objetivo de implementar soluciones en el mercado
                en el menor tiempo posible.
              </p>
              <div className="feat">
                <div className="fi">
                  <span className="dot"></span>
                  <span>170 hectareas de explotacion en produccion.</span>
                </div>
                <div className="fi">
                  <span className="dot"></span>
                  <span>Parcelas de experiencias para pruebas de concepto.</span>
                </div>
                <div className="fi">
                  <span className="dot"></span>
                  <span>Validacion en condiciones reales, no de laboratorio.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAMPO INSTRUMENTADO */}
      <section className="instru" id="campo">
        <div className="instru-bg">
          <Image
            src="/assets/aerea-cultivos.jpg"
            alt="Campo experimental instrumentado con sensores"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
        <SignalCanvas id="campo-canvas" />
        <div className="instru-inner">
          <span className="kicker esm reveal">El campo, instrumentado</span>
          <h2 className="reveal d1" style={{ marginTop: "18px" }}>
            Donde el dato se <em className="em-esm">cultiva</em> sobre el terreno.
          </h2>
          <p className="lede reveal d2" style={{ marginTop: "24px", maxWidth: "40ch" }}>
            Sensores de humedad, riego inteligente, NDVI por dron y modelos predictivos. Cada anillo es una senal del
            campo real.
          </p>
          <div className="instru-stat reveal d3">
            <div className="big">170</div>
            <div className="meta">
              <div className="t">hectareas en exclusiva para los socios, listas para validar tecnologia en condiciones reales.</div>
              <div className="s">Pistacho - olivo - almendro - vid</div>
            </div>
          </div>
        </div>
      </section>

      {/* EL RETO */}
      <section className="sec-pad bg-hueso" id="reto">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker esm reveal">Como trabajamos</span>
            <h2 className="display-l reveal d1">
              El recorrido de un <em className="em-esm">Reto</em>, de la necesidad al mercado.
            </h2>
          </div>
          <div className="reto-track reveal d1">
            <div className="reto-line">
              <div className="prog"></div>
            </div>
            <div className="reto-steps">
              {[
                { num: "01", title: "Necesidad", desc: "El socio plantea un reto productivo real.", active: false },
                { num: "02", title: "Reto", desc: "Se acota la solucion a desarrollar.", active: false },
                { num: "03", title: "Consorcio", desc: "Empresa + startup + centro tecnologico.", active: false },
                { num: "04", title: "Piloto en campo", desc: "Se prueba y valida en la Finca Antonete.", active: true },
                { num: "05", title: "Mercado", desc: "Se implementa lo validado, en el menor tiempo.", active: false },
              ].map((step, idx) => (
                <div key={idx} className="reto-step">
                  <div className="node">
                    <svg viewBox="0 0 66 66" fill="none" stroke={step.active ? "#5ec89c" : "#c9a95f"}>
                      <circle cx="33" cy="33" r={step.active ? 7 : 6} fill={step.active ? "#5ec89c" : "#c9a95f"} stroke="none" />
                      <circle cx="33" cy="33" r="15" strokeWidth={step.active ? 2.4 : 2} opacity={step.active ? 1 : 0.55} />
                      <circle cx="33" cy="33" r="25" strokeWidth="2" opacity={step.active ? 0.45 : 0.28} />
                    </svg>
                  </div>
                  <div className="scontent">
                    <div className="snum" style={step.active ? { color: "#2f8f63" } : undefined}>
                      {step.num}
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="reto-note reveal d2">
            <b>Ejemplo ilustrativo -</b> optimizacion del riego en almendro mediante sensores de humedad y un modelo
            predictivo, validado sobre las 31 ha de experiencias.
          </p>
        </div>
      </section>

      {/* TEMATICAS */}
      <section className="sec-pad bg-bosque" id="tematicas">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker oro reveal">Tematicas objetivo</span>
            <h2 className="display-l reveal d1">
              Donde buscamos la <em className="em-esm">innovacion</em>.
            </h2>
          </div>
          <div className="tem-grid">
            {[
              { num: "01", title: "Agricultura de precision", desc: "IoT, big data, machine learning e IA, robotica y blockchain." },
              { num: "02", title: "Economia circular", desc: "Reutilizacion y aprovechamiento de residuos agropecuarios." },
              { num: "03", title: "Energias renovables", desc: "Riego solar, bioenergias y reduccion de huella de carbono." },
              { num: "04", title: "Biotecnologia", desc: "Genetica e insumos bio-organicos para el cultivo." },
              { num: "05", title: "Fintech para el agro", desc: "Servicios y procesos financieros especificos del sector." },
              { num: "06", title: "E-commerce agroalimentario", desc: "Plataformas y vinculacion directa entre oferta y demanda." },
            ].map((tem, idx) => (
              <article key={idx} className={`tem reveal ${idx > 0 ? `d${idx % 3}` : ""}`}>
                <div className="tnum">{tem.num}</div>
                <h3>{tem.title}</h3>
                <p>{tem.desc}</p>
                <span className="tarrow">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="sec-pad bg-hueso">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker esm reveal">Ecosistema tecnologico</span>
            <h2 className="display-m reveal d1">
              Una biosfera respaldada por <em className="em-esm">lideres tecnologicos</em>.
            </h2>
            <p className="lede reveal d2">
              Acuerdos de colaboracion que dan a los socios acceso a software, datos, infraestructura, formacion y
              visibilidad.
            </p>
          </div>
          <div className="partners-row reveal d2">
            {["Microsoft", "AWS", "Telefonica", "Esri", "Inetum", "Red Hat"].map((partner) => (
              <div key={partner} className="partner">
                <span className="pn">{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUMATE */}
      <section className="sec-pad bg-bosque-900" id="sumate">
        <div className="wrap">
          {/* Beneficio fiscal */}
          <div className="fiscal reveal" style={{ marginBottom: "clamp(64px,9vw,120px)" }}>
            <div className="big">
              40<small>-50% de deduccion</small>
            </div>
            <div className="fiscal-detail">
              <span className="kicker oro" style={{ marginBottom: "18px" }}>
                Beneficios fiscales - Ley 49/2002
              </span>
              <h3>
                Las donaciones de empresas a la Fundacion <em className="em-esm">desgravan</em> en el Impuesto sobre
                Sociedades.
              </h3>
              <div className="fiscal-rows">
                <div className="fr">
                  <div className="fp">40%</div>
                  <div className="ft">
                    <b>Deduccion general</b>
                    <span>Sobre el importe donado, en la cuota integra del Impuesto sobre Sociedades.</span>
                  </div>
                </div>
                <div className="fr">
                  <div className="fp">50%</div>
                  <div className="ft">
                    <b>Fidelidad premiada</b>
                    <span>Si la empresa dona la misma cantidad o superior durante tres anos seguidos.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="hair" style={{ marginBottom: "clamp(56px,7vw,90px)" }} />

          <div className="cta-wrap">
            <div className="cta-left">
              <span className="kicker esm reveal">Sumate al ecosistema</span>
              <h2 className="reveal d1" style={{ marginTop: "16px" }}>
                Forma parte del Centro de Innovacion <em className="em-esm">Antonete</em>.
              </h2>
              <p className="lede reveal d2" style={{ marginTop: "22px" }}>
                Accede a tecnologia, conocimiento y nuevas oportunidades de crecimiento. Tres pasos para entrar:
              </p>
              <div className="cta-steps reveal d2">
                <div className="cs">
                  <div className="csn">01</div>
                  <div className="cst">
                    <b>Visita la finca</b>
                    <span>Conoce en persona el campo de experiencias.</span>
                  </div>
                </div>
                <div className="cs">
                  <div className="csn">02</div>
                  <div className="cst">
                    <b>Define tu primer Reto</b>
                    <span>Sin coste, junto a la oficina tecnica.</span>
                  </div>
                </div>
                <div className="cs">
                  <div className="csn">03</div>
                  <div className="cst">
                    <b>Formaliza tu adhesion</b>
                    <span>Y entra al ecosistema de innovacion.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card reveal d1" id="form">
              {!formSent ? (
                <form onSubmit={handleFormSubmit}>
                  <div className="fh">Solicitud de adhesion</div>
                  <div className="form-field">
                    <label>A que grupo perteneces?</label>
                    <div className="perfiles">
                      <label className="perfil">
                        <input type="radio" name="perfil" defaultChecked />
                        <div className="pbox">
                          <svg className="pi" viewBox="0 0 28 28" fill="none" stroke="currentColor">
                            <path d="M4 24V8l7-3 7 3v16M18 24V12l6 2.5V24M4 24h22M8 11h2M8 15h2M8 19h2" strokeWidth="1.7" />
                          </svg>
                          <span className="pl">Empresa agroalimentaria</span>
                        </div>
                      </label>
                      <label className="perfil">
                        <input type="radio" name="perfil" />
                        <div className="pbox">
                          <svg className="pi" viewBox="0 0 28 28" fill="none" stroke="currentColor">
                            <path d="M14 3c4 4 4 9 0 22M14 3c-4 4-4 9 0 22M14 5l5 4-5 3-5-3 5-4Z" strokeWidth="1.7" />
                          </svg>
                          <span className="pl">Startup Agrotech</span>
                        </div>
                      </label>
                      <label className="perfil">
                        <input type="radio" name="perfil" />
                        <div className="pbox">
                          <svg className="pi" viewBox="0 0 28 28" fill="none" stroke="currentColor">
                            <rect x="3" y="6" width="22" height="14" rx="2" strokeWidth="1.7" />
                            <path d="M10 24h8M14 20v4" strokeWidth="1.7" />
                          </svg>
                          <span className="pl">Empresa tecnologica</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Nombre y empresa</label>
                    <input type="text" placeholder="Tu nombre - organizacion" required />
                  </div>
                  <div className="form-field">
                    <label>Email corporativo</label>
                    <input type="email" placeholder="nombre@empresa.com" required />
                  </div>
                  <label className="form-consent">
                    <input type="checkbox" required /> He leido y acepto la <a href="#">politica de privacidad</a> y las{" "}
                    <a href="#">bases reguladoras</a>, y consiento el tratamiento de mis datos.
                  </label>
                  <button type="submit" className="btn btn-pri">
                    Enviar solicitud <span className="arw">-&gt;</span>
                  </button>
                </form>
              ) : (
                <div className="form-sent show">
                  <svg className="ck" viewBox="0 0 60 60" fill="none" stroke="currentColor">
                    <circle cx="30" cy="30" r="27" strokeWidth="2" />
                    <path d="M19 31l8 8 15-17" strokeWidth="2.4" />
                  </svg>
                  <h4>Solicitud recibida</h4>
                  <p>
                    Gracias. La oficina tecnica del CIA se pondra en contacto contigo para concertar tu visita a la
                    finca.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec-pad bg-hueso" id="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div className="sec-head">
              <span className="kicker esm reveal">Preguntas frecuentes</span>
              <h2 className="display-m reveal d1" style={{ marginTop: "16px" }}>
                Todo lo que un socio necesita saber.
              </h2>
            </div>
            <div className="faq-list reveal d1">
              {[
                {
                  q: "Como puedo ser miembro del CIA?",
                  a: "El CIA es un punto de encuentro para empresas del sector agroalimentario, startups, agricultores, ganaderos y centros de conocimiento. Si tu empresa o institucion desarrolla soluciones tecnologicas que ayuden al sector a ser mas rentable y productivo, eres bienvenido.",
                },
                {
                  q: "Que requisitos hay para usar las instalaciones?",
                  a: "En primer lugar, debes ser socio del CIA. Para desarrollar un proyecto, el CIA cuenta con un protocolo de actuacion que se entrega a los socios al incorporarse y que esta disponible en el acceso privado para su consulta.",
                },
                {
                  q: "Cuento con ayuda tecnica para desarrollar mi solucion?",
                  a: "Todas las actuaciones en campo o en los espacios fisicos cuentan con personal a disposicion de los socios. El socio rellena el formulario de peticion de uso; el Director tecnico estudia y valida la solicitud y, una vez aprobada, puede instalarse en el centro y desarrollar su proyecto con apoyo del personal de campo.",
                },
                {
                  q: "Tiene el CIA algun derecho sobre mis desarrollos?",
                  a: "No. Todos los desarrollos realizados en el CIA son propiedad del socio. Solo si se invita expresamente al CIA a participar en el proyecto, la direccion tomara la decision que corresponda en cada caso.",
                },
                {
                  q: "Podre participar en los proyectos del Centro?",
                  a: "El CIA nace como punto colaborativo para mejorar la digitalizacion del sector y fomenta especialmente los proyectos en colaboracion, sectoriales o transversales. Sera potestad del socio que inicie la propuesta invitar al resto, o bien ejecutarla individualmente.",
                },
                {
                  q: "Como socio, accedo a las tecnologias que se desarrollen?",
                  a: "Si. Una ventaja de ser socio es acceder a una base de datos de proyectos de tecnologias aplicadas al sector agroalimentario, facilitando la colaboracion entre empresas, startups, centros tecnologicos y administraciones -cumpliendo siempre el RGPD.",
                },
              ].map((faq, idx) => (
                <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
                  <button className="faq-q" onClick={() => handleFaqClick(idx)}>
                    <span className="qx"></span>
                    {faq.q}
                  </button>
                  <div className="faq-a" style={openFaq === idx ? { maxHeight: "500px" } : undefined}>
                    <div className="faq-a-inner">
                      <b>{faq.a.split(".")[0]}.</b>
                      {faq.a.slice(faq.a.indexOf(".") + 1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="flourish" aria-hidden="true">
          <Image src="/assets/flourish-tree.png" alt="" width={520} height={520} />
        </div>
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-logo">
              <Image src="/assets/logo-full-white.png" alt="Centro de Innovacion Antonete" width={200} height={54} />
              <p>Cluster de innovacion abierta del sector agroalimentario, sobre la historica Finca Antonete.</p>
            </div>
            <div className="footer-col">
              <h5>Navegacion</h5>
              <a href="#ecosistema">El proyecto</a>
              <a href="#espacio">El campo</a>
              <a href="#reto">El Reto</a>
              <a href="#tematicas">Tematicas</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h5>Contacto</h5>
              <a href="mailto:info@centroinnovacionantonete.com">info@centroinnovacionantonete.com</a>
              <p>
                Finca Antonete
                <br />
                Tarazona de la Mancha (Albacete)
              </p>
              <a href="#sumate" style={{ color: "var(--esmeralda)" }}>
                Sumate al ecosistema -&gt;
              </a>
            </div>
          </div>
          <div className="footer-bot">
            <span>
              © <span ref={yearRef}>2026</span> Centro de Innovacion Antonete - Fundacion acogida a la Ley 49/2002
            </span>
            <span className="lk">
              <a href="#">Informacion</a>
              <a href="#">Politica de Privacidad</a>
              <a href="#">Aviso Legal</a>
              <a href="#">Politica de Cookies</a>
              <a href="#">Bases Legales</a>
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
