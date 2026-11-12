# Come mandare una diagnosi quando il gioco si blocca o fa una cosa strana

Per chi prova «Ferruccio — Teatro delle Marionette». Serve a far capire all'autore **che cosa stava succedendo**:
notte, piano, personaggio, vita, oggetti addosso, la stanza coi suoi nemici, le scelte fatte, gli errori.

## Con le versioni dal 12 novembre 2026 in poi: un tasto

1. Quando succede la cosa strana **non chiudere la pagina**.
2. Premi **F8**. Il gioco salva un file `diagnosi-teatro-<data>.json` nella cartella dei download (e copia lo stesso
   testo negli appunti).
3. Manda quel file, insieme a **una foto dello schermo** e a due righe: che cosa stavi facendo e che cosa ti
   aspettavi.

## Con una versione più vecchia (F8 non fa niente)

Se la pagina è ancora aperta sul punto del problema:

1. Premi **F12**, apri la scheda **Console**.
2. Incolla questa riga e premi Invio (se il browser chiede di consentire l'incolla, scrivi `allow pasting`):

```js
(()=>{const R=statoRun,s=R.stanzaCorrente,f=(g)=>{try{return g()}catch(e){return null}};const d={quando:new Date().toISOString(),pagina:document.lastModified,fase:R.fase,notte:f(()=>getNumeroNotte()),piano:R.piano,ciclo:R.ciclo,personaggio:R.personaggioId,vita:[R.hpHalf,R.maxHpHalf],danno:R.dmg,oggetti:f(()=>R.oggettiEquipaggiati.map(o=>o.id)),attivo:f(()=>R.oggettoAttivo.id),pausa:R.pausa,banner:R.banner,dialogo:f(()=>Boolean(__teatro.t4qa.dialogo)),stanza:s&&{id:s.id,tipo:s.tipo,pulita:s.pulita,campi:Object.keys(s).filter(k=>/[A-Z][0-9]$/.test(k)),nemici:s.nemici.map(n=>({tipo:n.tipo,boss:n.boss,bossId:n.bossId,vita:String(n.hp),x:n.x,y:n.y,quota:n.airZ}))},mappa:f(()=>R.mappa.stanze.map(x=>x.tipo+(x.pulita?'✓':'')+(x===s?'←':'')).join(' ')),scelte:f(()=>__teatro.t4qa.flag),errori:f(()=>ERRORI_TEATRO)};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));a.download='diagnosi-teatro.json';a.click()})()
```

3. Si scarica `diagnosi-teatro.json`: manda quello, con la foto dello schermo.

## Se la pagina è già stata chiusa

Non si può più leggere lo stato della stanza. Aiutano comunque:

- la foto o il video del momento;
- il **personaggio**, la **notte** e il **piano**;
- con che cosa è caduto l'ultimo nemico (colpo normale, raggio, spada, bomba, bruciatura, catena, un oggetto attivo);
- se era aperta una finestra di dialogo o il menu di pausa;
- quale file del gioco è stato usato (data in cui è stato ricevuto).

Il **Registro delle notti** (dal menu di pausa) elenca gli oggetti dell'ultima notte: una foto di quella pagina
vale quasi quanto la diagnosi.
