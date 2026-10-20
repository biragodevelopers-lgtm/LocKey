# Termini e Condizioni d'Uso e Informativa sulla Privacy (Zero-Data)
**Software: LocKey**  
**Sviluppatore e Distributore: BiragoDev (www.biragodev.it)**  
**Versione: 1.0 (Ottobre 2026)**

---

## 1. Natura del Software e Licenza d'Uso Gratuita
1.1. Il software **LocKey** (di seguito denominato "Software") è sviluppato e distribuito a titolo completamente **gratuito (Freeware)** da **BiragoDev** (titolare del dominio [www.biragodev.it](https://www.biragodev.it)).  
1.2. BiragoDev concede all'utente finale una licenza non esclusiva, revocabile, a tempo indeterminato e non trasferibile per scaricare, installare ed utilizzare il Software per scopi sia personali che professionali, senza alcun costo di licenza o abbonamento.  
1.3. È severamente vietato decompilare, effettuare reverse engineering, modificare il marchio o rivendere il Software a terzi senza l'esplicito consenso scritto di BiragoDev.

---

## 2. Architettura Zero-Knowledge e Politica "Zero-Network"
2.1. **Nessun Dato in Rete**: LocKey è progettato con un'architettura **completamente offline (Air-Gapped / Zero-Network)**. Il Software non invia, non sincronizza e non trasferisce password, credenziali, nomi utente, indirizzi IP o dati personali a server di BiragoDev o a server di terze parti.  
2.2. **Crittografia Locale**: Tutti i dati salvati all'interno del Vault sono crittografati sul dispositivo dell'utente tramite algoritmo standard militare **AES-256-GCM** con derivazione crittografica della chiave master (**PBKDF2 SHA-256** con oltre 100.000 iterazioni) e/o protetti da chip hardware di sicurezza (**Secure Enclave** su macOS e **Windows DPAPI** su Windows).  
2.3. **Assenza di Telemetria**: Il Software non include sistemi di tracciamento, strumenti di profilazione pubblicitaria (SDK terzi), né telemetria d'uso.

---

## 3. Esclusiva Responsabilità dell'Utente sulla Master Password
3.1. In virtù del modello crittografico a Conoscenza Zero (Zero-Knowledge), **la Master Password scelta dall'utente non viene mai salvata in chiaro né registrata su alcun database esterno**.  
3.2. L'utente è l'unico ed esclusivo custode della propria Master Password. **In caso di smarrimento o dimenticanza della Master Password, è tecnicamente impossibile per BiragoDev, per i suoi sviluppatori o per chiunque altro recuperare o decifrare i dati memorizzati nel Vault**.  
3.3. L'utente si assume l'onere di effettuare periodicamente copie di backup del proprio database cifrato su supporti di memoria sicuri.

---

## 4. Esclusione di Garanzie ("Così com'è" / AS-IS)
4.1. Il Software viene fornito **"COSÌ COM'È" ("AS-IS")**, senza garanzie di alcun tipo, esplicite o implicite, incluse, a titolo esemplificativo ma non esaustivo, garanzie di commerciabilità, idoneità a uno scopo specifico, accuratezza o assenza di errori.  
4.2. BiragoDev non garantisce che il funzionamento del Software sia esente da interruzioni o errori dovuti ad aggiornamenti del sistema operativo host, corruzioni del filesystem locale, infezioni da malware preesistenti sul computer dell'utente o disservizi hardware.

---

## 5. Limitazione di Responsabilità
5.1. Nella misura massima consentita dalla legge applicabile, **in nessun caso BiragoDev, i suoi collaboratori o titolari potranno essere ritenuti responsabili per danni diretti, indiretti, speciali, incidentali, consequenziali o punitivi** (inclusi, a titolo esemplificativo, perdita di dati, mancato guadagno, interruzione di attività o perdita di informazioni confidenziali) derivanti dall'uso o dall'impossibilità di usare il Software, anche qualora BiragoDev fosse stata avvisata della possibilità di tali danni.  
5.2. L'utente riconosce che l'installazione e l'impiego del Software avvengono sotto la propria esclusiva responsabilità.

---

## 6. Informativa Privacy (Regolamento UE 2016/679 - GDPR)
6.1. **Titolare del Trattamento**: BiragoDev ([www.biragodev.it](https://www.biragodev.it)).  
6.2. **Dati trattati dal Software**: **NESSUN DATO**. Poiché il Software opera in ambiente locale ed isolato, BiragoDev non raccoglie, non conserva, non accede e non condivide alcun dato personale, identificativo o crittografico dell'utente.  
6.3. Eventuali interazioni dell'utente tramite il sito web istituzionale (es. modulo di contatto o download su [www.biragodev.it](https://www.biragodev.it)) sono disciplinate dalla Privacy Policy del sito stesso.

---

## 7. Proprietà Intellettuale e Marchio
7.1. Il nome "LocKey", il logo, il marchio "BiragoDev" e il dominio [www.biragodev.it](https://www.biragodev.it) sono di esclusiva proprietà di BiragoDev.  
7.2. La concessione d'uso gratuito del Software non trasferisce all'utente alcun diritto di proprietà intellettuale sul Software o sui marchi associati.

---

## 8. Legge Applicabile e Foro Competente
8.1. I presenti Termini e Condizioni sono regolati e interpretati secondo la **legge italiana**.  
8.2. Per qualsiasi controversia dovesse insorgere in merito all'interpretazione, validità o esecuzione dei presenti termini, sarà competente in via esclusiva il Foro di residenza o sede legale dello sviluppatore BiragoDev, salvo diversa inderogabile disposizione di legge a tutela del consumatore.

---

*Per contatti, informazioni sullo sviluppo software e supporto: [www.biragodev.it](https://www.biragodev.it)*
