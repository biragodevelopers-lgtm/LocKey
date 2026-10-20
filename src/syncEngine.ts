// Motore di Sincronizzazione Smart per LocKey (Zero-Knowledge Client-Side)

export interface Tombstone {
  id: string;
  type: 'group' | 'application' | 'credential';
  deletedAt: string;
}

export interface Credential {
  id: string;
  username: string;
  passwordCiphertext: string;
  passwordNonce: string;
  notes?: string;
  totpSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  name: string;
  url?: string;
  credentials: Credential[];
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  applications: Application[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultDatabase {
  groups: Group[];
  version: number;
  tombstones?: Tombstone[];
}

// Mantiene i tombstones solo degli ultimi 30 giorni per evitare una crescita eccessiva del database
const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function mergeVaults(local: VaultDatabase, remote: VaultDatabase): VaultDatabase {
  const mergedTombstones: Tombstone[] = [];
  const tombstoneMap = new Map<string, Tombstone>();

  // Helper per aggiungere tombstones risolvendo duplicati
  const addTombstones = (list?: Tombstone[]) => {
    if (!list) return;
    for (const t of list) {
      const existing = tombstoneMap.get(t.id);
      if (!existing || new Date(t.deletedAt) > new Date(existing.deletedAt)) {
        tombstoneMap.set(t.id, t);
      }
    }
  };

  addTombstones(local.tombstones);
  addTombstones(remote.tombstones);

  // Filtra i tombstones scaduti (più vecchi di 30 giorni)
  const now = new Date();
  for (const t of tombstoneMap.values()) {
    const deletedTime = new Date(t.deletedAt).getTime();
    if (now.getTime() - deletedTime < TOMBSTONE_RETENTION_MS) {
      mergedTombstones.push(t);
    }
  }

  // Helper per verificare se un elemento è stato eliminato
  const isDeleted = (id: string, updatedAtStr: string): boolean => {
    const tombstone = tombstoneMap.get(id);
    if (!tombstone) return false;
    return new Date(tombstone.deletedAt) > new Date(updatedAtStr);
  };

  // Merge delle credenziali all'interno di un'applicazione
  const mergeCredentials = (localCreds: Credential[], remoteCreds: Credential[]): Credential[] => {
    const credMap = new Map<string, Credential>();
    
    // Raccoglie tutte le credenziali locali non eliminate
    for (const c of localCreds) {
      if (!isDeleted(c.id, c.updatedAt)) {
        credMap.set(c.id, c);
      }
    }

    // Unisce con le credenziali remote
    for (const rc of remoteCreds) {
      if (isDeleted(rc.id, rc.updatedAt)) {
        credMap.delete(rc.id);
        continue;
      }
      
      const lc = credMap.get(rc.id);
      if (!lc) {
        credMap.set(rc.id, rc);
      } else {
        // Se esiste in entrambi, tieni la più recente
        if (new Date(rc.updatedAt) > new Date(lc.updatedAt)) {
          credMap.set(rc.id, rc);
        }
      }
    }

    return Array.from(credMap.values());
  };

  // Merge delle applicazioni all'interno di un gruppo
  const mergeApplications = (localApps: Application[], remoteApps: Application[]): Application[] => {
    const appMap = new Map<string, Application>();

    // Raccoglie le applicazioni locali non eliminate
    for (const a of localApps) {
      if (!isDeleted(a.id, a.updatedAt)) {
        appMap.set(a.id, a);
      }
    }

    // Unisce con le applicazioni remote
    for (const ra of remoteApps) {
      if (isDeleted(ra.id, ra.updatedAt)) {
        appMap.delete(ra.id);
        continue;
      }

      const la = appMap.get(ra.id);
      if (!la) {
        appMap.set(ra.id, ra);
      } else {
        // Se esiste in entrambi, fondi le credenziali ricorsivamente
        const mergedCreds = mergeCredentials(la.credentials, ra.credentials);
        
        // Mantieni l'intestazione più recente dell'applicazione
        const isRemoteNewer = new Date(ra.updatedAt) > new Date(la.updatedAt);
        appMap.set(ra.id, {
          id: ra.id,
          name: isRemoteNewer ? ra.name : la.name,
          url: isRemoteNewer ? ra.url : la.url,
          credentials: mergedCreds,
          createdAt: isRemoteNewer ? ra.createdAt : la.createdAt,
          updatedAt: isRemoteNewer ? ra.updatedAt : la.updatedAt,
        });
      }
    }

    return Array.from(appMap.values());
  };

  // Merge dei gruppi a livello radice
  const groupMap = new Map<string, Group>();

  // Raccoglie i gruppi locali non eliminati
  for (const g of local.groups) {
    if (!isDeleted(g.id, g.updatedAt)) {
      groupMap.set(g.id, g);
    }
  }

  // Unisce con i gruppi remoti
  for (const rg of remote.groups) {
    if (isDeleted(rg.id, rg.updatedAt)) {
      groupMap.delete(rg.id);
      continue;
    }

    const lg = groupMap.get(rg.id);
    if (!lg) {
      groupMap.set(rg.id, rg);
    } else {
      // Se esiste in entrambi, fondi le applicazioni ricorsivamente
      const mergedApps = mergeApplications(lg.applications, rg.applications);

      // Mantieni l'intestazione del gruppo più recente
      const isRemoteNewer = new Date(rg.updatedAt) > new Date(lg.updatedAt);
      groupMap.set(rg.id, {
        id: rg.id,
        name: isRemoteNewer ? rg.name : lg.name,
        applications: mergedApps,
        createdAt: isRemoteNewer ? rg.createdAt : lg.createdAt,
        updatedAt: isRemoteNewer ? rg.updatedAt : lg.updatedAt,
      });
    }
  }

  return {
    version: Math.max(local.version || 1, remote.version || 1),
    groups: Array.from(groupMap.values()),
    tombstones: mergedTombstones,
  };
}
