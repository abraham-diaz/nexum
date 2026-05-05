import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const INDENT_STEP = 24; // px per indent level
const MAX_INDENT = 10;

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;
              if (marginLeft) {
                return Math.round(parseInt(marginLeft, 10) / INDENT_STEP);
              }
              return 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return {
                style: `margin-left: ${attributes.indent * INDENT_STEP}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isTextblock || node.type.name === "bulletList" || node.type.name === "orderedList" || node.type.name === "taskList") {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < MAX_INDENT) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isTextblock || node.type.name === "bulletList" || node.type.name === "orderedList" || node.type.name === "taskList") {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > 0) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("indent-preserve-on-list-create"),
        appendTransaction(transactions, oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const newTr = newState.tr;
          let modified = false;

          newState.doc.descendants((newNode, pos) => {
            const typeName = newNode.type.name;
            if (typeName !== "bulletList" && typeName !== "orderedList") return true;
            if ((newNode.attrs.indent || 0) > 0) return true;

            try {
              const oldNode = oldState.doc.nodeAt(pos);
              if (
                oldNode &&
                (oldNode.type.name === "paragraph" || oldNode.type.name === "heading") &&
                (oldNode.attrs.indent || 0) > 0
              ) {
                newTr.setNodeMarkup(pos, undefined, {
                  ...newNode.attrs,
                  indent: oldNode.attrs.indent,
                });
                modified = true;
              }
            } catch {
              // position didn't exist in old state
            }

            return true;
          });

          return modified ? newTr : null;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { editor } = this;

        // Inside a list, delegate to native Tiptap sink (nesting)
        if (
          editor.isActive("listItem") ||
          editor.isActive("taskItem")
        ) {
          // sinkListItem returns false when it can't sink further
          const sunk = editor.isActive("taskItem")
            ? editor.chain().focus().sinkListItem("taskItem").run()
            : editor.chain().focus().sinkListItem("listItem").run();
          return sunk;
        }

        return editor.commands.indent();
      },
      "Shift-Tab": () => {
        const { editor } = this;

        // Inside a list, delegate to native Tiptap lift (un-nesting)
        if (
          editor.isActive("listItem") ||
          editor.isActive("taskItem")
        ) {
          const lifted = editor.isActive("taskItem")
            ? editor.chain().focus().liftListItem("taskItem").run()
            : editor.chain().focus().liftListItem("listItem").run();
          return lifted;
        }

        return editor.commands.outdent();
      },
    };
  },
});
