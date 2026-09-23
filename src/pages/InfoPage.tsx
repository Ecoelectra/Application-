import { Callout } from '../components/Callout';
import { REACTIONS } from '../data/reactions';
import { SUBSTANCES } from '../data/substances';
import { STANDARD_POTENTIALS } from '../data/potentials';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { clearCache } from '../services/pubchem';
import { useCatalog } from '../hooks/useCatalog';
import { catalogStats } from '../data/catalog';
import { formatNumber } from '../chem/format';

export function InfoPage() {
  const { catalog, loading: catalogLoading } = useCatalog();
  const stats = catalogStats(catalog);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Hinweise und Installation</h1>
        <p>
          Wie die App arbeitet, woher die Daten kommen und wie du sie auf dem iPad und unter Windows
          installierst.
        </p>
      </header>

      <div className="stack">
        <Callout variant="danger" title="Sicherheit geht vor">
          <p style={{ marginBottom: 6 }}>
            Die Anleitungen sind Lern- und Planungsmaterial, keine Freigabe zum Experimentieren.
            Chemische Synthesen gehören in ein dafür eingerichtetes Labor, mit Gefährdungsbeurteilung,
            Aufsicht und Absaugung.
          </p>
          <p style={{ marginBottom: 0 }}>
            Verbindlich sind immer die Sicherheitsdatenblätter der Hersteller und die Regeln deiner
            Einrichtung. Für Stoffgruppen mit ausschließlich schädigender Verwendung (chemische
            Kampfstoffe, Explosivstoffe, Betäubungsmittel) zeigt die App bewusst keine
            Synthesevorschriften.
          </p>
        </Callout>

        <div className="card">
          <h2>Was die App kann</h2>
          <ul style={{ paddingLeft: 18 }}>
            <li>
              <strong>Stoff eingeben</strong> – als Name, Summenformel, CAS-Nummer oder SMILES. Die
              App erkennt die funktionellen Gruppen im Molekül.
            </li>
            <li>
              <strong>Reaktionen vorschlagen</strong> – passende Synthesen werden nach Passgenauigkeit
              sortiert. Wo eine Reaktionsvorschrift hinterlegt ist, wird das Produkt aus der Struktur
              berechnet und gezeichnet.
            </li>
            <li>
              <strong>Anleitung anzeigen</strong> – Schritt für Schritt, mit Reagenzien, Bedingungen,
              Aufarbeitung, Ansatzrechner und Sicherheitshinweisen.
            </li>
            <li>
              <strong>Mechanismus verstehen</strong> – Teilschritte mit gezeichneten Gleichungen,
              Elektronenfluss und schematischem Energieprofil.
            </li>
            <li>
              <strong>Suchen und rechnen</strong> – Volltextsuche über alle Reaktionen, Spannungsreihe,
              Nernst- und Faraday-Rechner, Gleichungsausgleicher.
            </li>
          </ul>
        </div>

        <div className="card">
          <h2>Installation auf dem iPad</h2>
          <ol style={{ paddingLeft: 18 }}>
            <li>Die App-Adresse in <strong>Safari</strong> öffnen (nicht Chrome – nur Safari darf installieren).</li>
            <li>Auf das <strong>Teilen-Symbol</strong> tippen (Quadrat mit Pfeil nach oben).</li>
            <li><strong>«Zum Home-Bildschirm»</strong> wählen und bestätigen.</li>
            <li>
              Die App startet danach im Vollbild ohne Browserleiste und funktioniert auch offline –
              inklusive Strukturberechnung, Reaktionsdatenbank und Rechnern.
            </li>
          </ol>
          <p className="subtle" style={{ marginBottom: 0 }}>
            Nur die PubChem-Suche braucht eine Internetverbindung. Alles andere liegt auf dem Gerät.
          </p>
        </div>

        <div className="card">
          <h2>Installation unter Windows</h2>
          <p>Es gibt zwei Wege:</p>
          <ol style={{ paddingLeft: 18 }}>
            <li>
              <strong>Als App aus dem Browser:</strong> Seite in Edge oder Chrome öffnen, im Menü
              «Apps» → «Diese Website als App installieren» wählen. Es entsteht ein eigenes
              Fenster mit Startmenü-Eintrag.
            </li>
            <li>
              <strong>Als klassisches Programm:</strong> Das Repository enthält eine
              Tauri-Konfiguration. Mit <code>npm run tauri:build</code> entsteht ein
              Windows-Installer (.msi und .exe). Der mitgelieferte GitHub-Actions-Workflow baut ihn
              automatisch.
            </li>
          </ol>
        </div>

        <div className="card">
          <h2>Datenbestand</h2>
          <div className="grid grid-4">
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                {catalogLoading ? '…' : formatNumber(stats.total, 0)}
              </div>
              <div className="subtle">berechnete Synthesen</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{REACTIONS.length}</div>
              <div className="subtle">Reaktionstypen mit Mechanismus</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{SUBSTANCES.length}</div>
              <div className="subtle">Stoffe offline</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{STANDARD_POTENTIALS.length}</div>
              <div className="subtle">Standardpotentiale</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{FUNCTIONAL_GROUPS.length}</div>
              <div className="subtle">funktionelle Gruppen</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Woher die Daten stammen</h2>
          <ul style={{ paddingLeft: 18 }}>
            <li>
              <strong>Stoffdaten:</strong>{' '}
              <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noreferrer">
                PubChem
              </a>{' '}
              (National Library of Medicine) über die PUG-REST-Schnittstelle, ergänzt um eine
              mitgelieferte Offline-Datenbank.
            </li>
            <li>
              <strong>Strukturberechnung:</strong>{' '}
              <a href="https://www.rdkit.org/" target="_blank" rel="noreferrer">
                RDKit
              </a>{' '}
              als WebAssembly-Modul – läuft vollständig auf dem Gerät, es werden keine Strukturen
              verschickt.
            </li>
            <li>
              <strong>Reaktionen und Mechanismen:</strong> kuratiert nach Standardwerken (Organikum,
              Clayden, Hollemann-Wiberg, Ullmann's Encyclopedia) und den bei jeder Reaktion
              angegebenen Originalarbeiten.
            </li>
            <li>
              <strong>Standardpotentiale:</strong> Tabellenwerte gegen die Normalwasserstoffelektrode
              bei 25 °C.
            </li>
          </ul>
        </div>

        <div className="card">
          <h2>Datenschutz</h2>
          <p>
            Die App speichert nur lokal auf deinem Gerät: zuletzt angesehene Stoffe, die Einstellung
            für helles oder dunkles Design und einen Zwischenspeicher der PubChem-Antworten. Es gibt
            keine Konten, keine Analyse und keinen eigenen Server. Beim Nachschlagen eines Stoffs
            wird eine Anfrage an PubChem gestellt.
          </p>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => {
              clearCache();
              window.alert('Der PubChem-Zwischenspeicher wurde geleert.');
            }}
          >
            Zwischenspeicher leeren
          </button>
        </div>

        <div className="card">
          <h2>Grenzen</h2>
          <p style={{ marginBottom: 0 }}>
            Die Reaktionsvorschläge beruhen auf Mustererkennung: Die App prüft, ob die passende
            funktionelle Gruppe vorhanden ist, und wendet die hinterlegte Vorschrift an. Sie
            berücksichtigt weder Sterik noch Schutzgruppen, konkurrierende Gruppen im selben Molekül
            oder die tatsächliche Reaktivität. Ein berechnetes Produkt ist ein Vorschlag, kein
            Versprechen – die fachliche Prüfung bleibt bei dir.
          </p>
        </div>
      </div>
    </main>
  );
}
