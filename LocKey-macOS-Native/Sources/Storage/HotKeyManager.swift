import Carbon
import AppKit

/// Gestore globale delle scorciatoie da tastiera di sistema (HotKeys) tramite Carbon API.
public final class HotKeyManager {
    public static let shared = HotKeyManager()
    
    private var hotKeyRef: EventHotKeyRef?
    private var onHotKey: (() -> Void)?
    
    private init() {}
    
    /// Registra una scorciatoia globale.
    /// - Parameters:
    ///   - keyCode: Il tasto virtuale di Carbon (es. 37 per 'L').
    ///   - modifiers: Modificatori di Carbon (es. optionKey = 0x0800).
    ///   - handler: Closure da eseguire alla pressione dell'HotKey.
    public func register(keyCode: UInt32, modifiers: UInt32, handler: @escaping () -> Void) {
        self.onHotKey = handler
        
        var hotKeyID = EventHotKeyID()
        hotKeyID.signature = OSType(0x4c4b5921) // 'LKY!'
        hotKeyID.id = 1
        
        var eventType = EventTypeSpec()
        eventType.eventClass = OSType(kEventClassKeyboard)
        eventType.eventKind = OSType(kEventHotKeyPressed)
        
        let eventHandler: EventHandlerUPP = { (_, event, userData) -> OSStatus in
            guard let userData = userData else { return noErr }
            let manager = Unmanaged<HotKeyManager>.fromOpaque(userData).takeUnretainedValue()
            manager.handleHotKey()
            return noErr
        }
        
        let selfPointer = Unmanaged.passUnretained(self).toOpaque()
        let target = GetApplicationEventTarget()
        
        InstallEventHandler(target, eventHandler, 1, &eventType, selfPointer, nil)
        RegisterEventHotKey(keyCode, modifiers, hotKeyID, target, 0, &hotKeyRef)
    }
    
    private func handleHotKey() {
        DispatchQueue.main.async {
            self.onHotKey?()
        }
    }
}
