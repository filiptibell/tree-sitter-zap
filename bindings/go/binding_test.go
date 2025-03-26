package tree_sitter_zap_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_zap "github.com/tree-sitter/tree-sitter-zap/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_zap.Language())
	if language == nil {
		t.Errorf("Error loading Zap grammar")
	}
}
