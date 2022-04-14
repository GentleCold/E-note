module.exports = [
    {
        label: 'File',
        submenu: [],
    },
    {
        label: 'Edit',
        submenu: [
            {
                role: 'undo'
            },
            {
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                role: 'cut'
            },
            {
                role: 'copy'
            },
            {
                role: 'paste'
            },
            {
                role: 'delete'
            },
            {
                role: 'selectAll'
            }
        ]
    },
    {
        label: 'View',
        submenu: []
    },
]