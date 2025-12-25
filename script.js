class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.editingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // フォーム送信
        document.getElementById('todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // フィルターボタン
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 編集フォーム
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // 編集キャンセル
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // モーダル外クリックで閉じる
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });
    }

    loadTodos() {
        const todos = localStorage.getItem('todos');
        return todos ? JSON.parse(todos) : [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    addTodo() {
        const title = document.getElementById('todo-title').value.trim();
        const priority = document.getElementById('todo-priority').value;
        const deadline = document.getElementById('todo-deadline').value;

        if (!title) return;

        const todo = {
            id: Date.now(),
            title,
            priority,
            deadline,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();

        // フォームをリセット
        document.getElementById('todo-form').reset();
    }

    deleteTodo(id) {
        if (confirm('このTODOを削除してもよろしいですか？')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.render();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    openEditModal(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        document.getElementById('edit-title').value = todo.title;
        document.getElementById('edit-priority').value = todo.priority;
        document.getElementById('edit-deadline').value = todo.deadline || '';

        document.getElementById('edit-modal').classList.add('active');
    }

    closeEditModal() {
        this.editingId = null;
        document.getElementById('edit-modal').classList.remove('active');
        document.getElementById('edit-form').reset();
    }

    saveEdit() {
        const todo = this.todos.find(t => t.id === this.editingId);
        if (!todo) return;

        todo.title = document.getElementById('edit-title').value.trim();
        todo.priority = document.getElementById('edit-priority').value;
        todo.deadline = document.getElementById('edit-deadline').value;

        this.saveTodos();
        this.closeEditModal();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // フィルターボタンのアクティブ状態を更新
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    isOverdue(deadline) {
        if (!deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        return deadlineDate < today;
    }

    getPriorityText(priority) {
        const priorityMap = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        return priorityMap[priority] || priority;
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item priority-${todo.priority}`;
        if (todo.completed) {
            li.classList.add('completed');
        }

        const deadlineText = todo.deadline
            ? `<span class="todo-deadline" ${this.isOverdue(todo.deadline) && !todo.completed ? 'style="color: #dc3545; font-weight: bold;"' : ''}>
                📅 ${this.formatDate(todo.deadline)}
                ${this.isOverdue(todo.deadline) && !todo.completed ? ' (期限切れ)' : ''}
               </span>`
            : '';

        li.innerHTML = `
            <div class="todo-left">
                <input type="checkbox"
                       class="todo-checkbox"
                       ${todo.completed ? 'checked' : ''}
                       onchange="app.toggleTodo(${todo.id})">
                <div class="todo-content">
                    <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                    <div class="todo-meta">
                        <span class="todo-priority">
                            <span class="priority-badge ${todo.priority}">${this.getPriorityText(todo.priority)}</span>
                        </span>
                        ${deadlineText}
                    </div>
                </div>
            </div>
            <div class="todo-actions">
                <button class="icon-btn edit-btn" onclick="app.openEditModal(${todo.id})" title="編集">✏️</button>
                <button class="icon-btn delete-btn" onclick="app.deleteTodo(${todo.id})" title="削除">🗑️</button>
            </div>
        `;

        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const todoList = document.getElementById('todo-list');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <p>${this.currentFilter === 'all' ? 'TODOがありません' :
                         this.currentFilter === 'active' ? '未完了のTODOがありません' :
                         '完了したTODOがありません'}</p>
                </div>
            `;
            return;
        }

        filteredTodos.forEach(todo => {
            todoList.appendChild(this.createTodoElement(todo));
        });
    }
}

// アプリケーションの初期化
const app = new TodoApp();
