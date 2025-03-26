import XCTest
import SwiftTreeSitter
import TreeSitterZap

final class TreeSitterZapTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_zap())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Zap grammar")
    }
}
