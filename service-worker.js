/* Service worker: l'app funziona anche senza rete.
   Strategia "prima la rete, poi la cache": quando sei online ricevi sempre la versione
   più recente, quando sei offline usi l'ultima copia salvata.
   Per forzare un aggiornamento cambia il numero di versione qui sotto. */
const VERSIONE = "dieta-zona-v9";
const FILE_BASE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function(evento){
    evento.waitUntil(caches.open(VERSIONE).then(function(cache){ return cache.addAll(FILE_BASE); }));
    self.skipWaiting();
});

self.addEventListener("activate", function(evento){
    evento.waitUntil(
        caches.keys()
            .then(function(chiavi){
                return Promise.all(chiavi.filter(function(k){ return k !== VERSIONE; }).map(function(k){ return caches.delete(k); }));
            })
            .then(function(){ return self.clients.claim(); })
    );
});

self.addEventListener("fetch", function(evento){
    if(evento.request.method !== "GET") return;
    const url = new URL(evento.request.url);
    if(url.origin !== self.location.origin) return;

    evento.respondWith(
        fetch(evento.request)
            .then(function(risposta){
                if(risposta && risposta.ok){
                    const copia = risposta.clone();
                    caches.open(VERSIONE).then(function(cache){ cache.put(evento.request, copia); });
                }
                return risposta;
            })
            .catch(function(){
                return caches.match(evento.request).then(function(r){ return r || caches.match("./index.html"); });
            })
    );
});
