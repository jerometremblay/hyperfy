import Foundation
import Security

let input = FileHandle.standardInput.readDataToEndOfFile()
let values = try JSONSerialization.jsonObject(with: input) as! [String: String]
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "org.hyperfy.speaker",
    kSecAttrAccount as String: values["world"]!,
]
let update = [kSecValueData as String: Data(values["token"]!.utf8)]
var result = SecItemUpdate(query as CFDictionary, update as CFDictionary)
if result == errSecItemNotFound {
    var trusted: SecTrustedApplication?
    let trustedStatus = SecTrustedApplicationCreateFromPath(
        "/Applications/Hyperfy Speaker.app", &trusted
    )
    guard trustedStatus == errSecSuccess, let trusted else { exit(1) }
    var access: SecAccess?
    guard SecAccessCreate("Hyperfy Speaker world token" as CFString, [trusted] as CFArray, &access) == errSecSuccess,
          let access else { exit(1) }
    var item = query
    item.merge(update) { _, new in new }
    item[kSecAttrAccess as String] = access
    result = SecItemAdd(item as CFDictionary, nil)
}
guard result == errSecSuccess else { exit(1) }
print("World token saved in Keychain.")
