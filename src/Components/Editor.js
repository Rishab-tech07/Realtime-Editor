import React, { useEffect, useRef } from 'react';
import 'codemirror/lib/codemirror.css';
import CodeMirror from 'codemirror';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Action';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        // Initialize CodeMirror
        async function initEditor() {
            editorRef.current = CodeMirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Attach change event to CodeMirror
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();

                // Trigger code change handler
                onCodeChange(code);

                // Emit code change event only if the change is not from `setValue`
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }

        initEditor();
    }, [onCodeChange, roomId, socketRef]);

    useEffect(() => {
        // Handle incoming CODE_CHANGE events
        if (socketRef.current) {
            const handleCodeChange = ({ code }) => {
                if (code !== null && code !== editorRef.current.getValue()) {
                    editorRef.current.setValue(code);
                }
            };

            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

            // Cleanup listener on unmount
            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            };
        }
    }, [socketRef]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
