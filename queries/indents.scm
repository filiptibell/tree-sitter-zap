[
  (struct_type)
  (enum_type)
  (enum_tagged_type)
  (enum_variant_fields)
  (event_declaration)
  (function_declaration)
] @indent

; Indent contents between braces
[
  "{"
  "("
  "["
] @indent

; Dedent on closing braces
[
  "}"
  ")"
  "]"
] @outdent

; Ignore comments for indentation
(comment) @ignore
