// Variable global para almacenar el ID único de cada tarea
        let taskIdCounter = 0;

        // Función para guardar todas las tareas en localStorage
        function saveTasks() {
            const tasks = [];
            
            // Recorrer todas las columnas y recopilar tareas
            ['todo', 'doing', 'done'].forEach(columnId => {
                const zone = document.getElementById(columnId + '-zone');
                const taskCards = zone.querySelectorAll('.task-card');
                
                taskCards.forEach(card => {
                    const taskData = {
                        id: card.id,
                        text: card.querySelector('.task-text').textContent,
                        priority: card.getAttribute('data-priority'),
                        column: columnId
                    };
                    tasks.push(taskData);
                });
            });
            
            // Guardar en localStorage
            localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
            localStorage.setItem('taskIdCounter', taskIdCounter.toString());
        }

        // Función para cargar tareas desde localStorage
        function loadTasks() {
            const savedTasks = localStorage.getItem('kanbanTasks');
            const savedCounter = localStorage.getItem('taskIdCounter');
            
            if (savedCounter) {
                taskIdCounter = parseInt(savedCounter);
            }
            
            if (savedTasks) {
                const tasks = JSON.parse(savedTasks);
                
                // Crear cada tarea guardada
                tasks.forEach(taskData => {
                    createTaskCardFromData(taskData);
                });
                
                // Actualizar todos los contadores
                ['todo', 'doing', 'done'].forEach(columnId => {
                    updateTaskCounter(columnId);
                });
            }
        }

        // Función para manejar la tecla Enter en el input
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                addTask();
            }
        }

        // Función principal para agregar una nueva tarea
        function addTask() {
            const taskInput = document.getElementById('taskInput');
            const prioritySelect = document.getElementById('prioritySelect');
            const taskText = taskInput.value.trim();
            const priority = prioritySelect.value;
            
            // Validar que el input no esté vacío
            if (taskText === '') {
                alert('Please enter a task.');
                return;
            }

            // Crear la tarea y agregarla a la columna "Sin Empezar"
            createTaskCard(taskText, 'todo', priority);
            
            // Limpiar el input después de agregar la tarea
            taskInput.value = '';
            
            // Guardar cambios
            saveTasks();
        }

        // Función para crear una tarjeta de tarea
        function createTaskCard(taskText, columnId, priority = 'baja') {
            // Generar ID único para la tarea
            const taskId = 'task-' + (++taskIdCounter);
            
            // Crear el elemento div para la tarjeta
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.draggable = true; // Hacer la tarjeta arrastrable
            taskCard.id = taskId;
            taskCard.setAttribute('data-priority', priority); // Guardar prioridad
            
            // Agregar eventos de drag and drop
            taskCard.ondragstart = function(event) { dragStart(event, taskId); };
            taskCard.ondragend = function(event) { dragEnd(event); };
            
            // Generar botones según la columna actual
            const actionButtons = generateActionButtons(taskId, columnId);
            
            // Obtener texto y emoji de prioridad
            const priorityInfo = getPriorityInfo(priority);
            
            // Estructura HTML de la tarjeta
            taskCard.innerHTML = `
                <div class="priority-tag priority-${priority}">${priorityInfo.emoji} ${priorityInfo.text}</div>
                <div class="task-text">${taskText}</div>
                <div class="task-actions">
                    ${actionButtons}
                    <button class="task-btn delete-btn" onclick="deleteTask('${taskId}')">Delete</button>
                </div>
            `;
            
            // Agregar la tarea a la columna especificada
            document.getElementById(columnId + '-zone').appendChild(taskCard);
            
            // Actualizar el contador de esa columna
            updateTaskCounter(columnId);
        }

        // Función para crear tarea desde datos guardados
        function createTaskCardFromData(taskData) {
            // Crear el elemento div para la tarjeta
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.draggable = true;
            taskCard.id = taskData.id;
            taskCard.setAttribute('data-priority', taskData.priority);
            
            // Agregar eventos de drag and drop
            taskCard.ondragstart = function(event) { dragStart(event, taskData.id); };
            taskCard.ondragend = function(event) { dragEnd(event); };
            
            // Generar botones según la columna
            const actionButtons = generateActionButtons(taskData.id, taskData.column);
            
            // Obtener texto y emoji de prioridad
            const priorityInfo = getPriorityInfo(taskData.priority);
            
            // Estructura HTML de la tarjeta
            taskCard.innerHTML = `
                <div class="priority-tag priority-${taskData.priority}">${priorityInfo.emoji} ${priorityInfo.text}</div>
                <div class="task-text">${taskData.text}</div>
                <div class="task-actions">
                    ${actionButtons}
                    <button class="task-btn delete-btn" onclick="deleteTask('${taskData.id}')">Delete</button>
                </div>
            `;
            
            // Agregar la tarea a la columna especificada
            document.getElementById(taskData.column + '-zone').appendChild(taskCard);
        }

        // Función para obtener información de prioridad
        function getPriorityInfo(priority) {
            const priorities = {
                'alta': { text: 'Alta', emoji: '🔴' },
                'media': { text: 'Media', emoji: '🟡' },
                'baja': { text: 'Baja', emoji: '🟢' }
            };
            return priorities[priority] || priorities['baja'];
        }

        // Función para generar los botones de acción según la columna
        function generateActionButtons(taskId, columnId) {
            let buttons = '';
            
            switch(columnId) {
                case 'todo':
                    // En "Sin Empezar" solo puede avanzar a "En Proceso"
                    buttons = `<button class="task-btn move-btn" onclick="moveTask('${taskId}', 'doing')">Iniciar</button>`;
                    break;
                    
                case 'doing':
                    // En "En Proceso" puede retroceder a "Sin Empezar" o avanzar a "Finalizado"
                    buttons = `
                        <button class="task-btn back-btn" onclick="moveTask('${taskId}', 'todo')">← Volver</button>
                        <button class="task-btn move-btn" onclick="moveTask('${taskId}', 'done')">Finalizar</button>
                    `;
                    break;
                    
                case 'done':
                    // En "Finalizado" solo puede retroceder a "En Proceso"
                    buttons = `<button class="task-btn back-btn" onclick="moveTask('${taskId}', 'doing')">← Reabrir</button>`;
                    break;
            }
            
            return buttons;
        }

        // Función que se ejecuta cuando comienza el arrastre
        function dragStart(event, taskId) {
            // Guardar el ID de la tarea que se está arrastrando
            event.dataTransfer.setData('text/plain', taskId);
            
            // Agregar clase visual para mostrar que se está arrastrando
            document.getElementById(taskId).classList.add('dragging');
        }

        // Función que se ejecuta cuando termina el arrastre
        function dragEnd(event) {
            // Remover la clase visual de arrastre
            event.target.classList.remove('dragging');
        }

        // Función para permitir el drop sobre las zonas válidas
        function allowDrop(event) {
            event.preventDefault(); // Necesario para permitir el drop
            
            // Agregar efecto visual cuando se arrastra sobre una zona
            event.currentTarget.classList.add('drag-over');
        }

        // Función para mover una tarea entre columnas usando botones
        function moveTask(taskId, targetColumn) {
            const taskElement = document.getElementById(taskId);
            if (!taskElement) return;
            
            // Obtener la columna origen
            const sourceColumn = getTaskColumn(taskElement);
            
            // Solo mover si es diferente columna
            if (sourceColumn === targetColumn) return;
            
            // Obtener datos de la tarea
            const taskText = taskElement.querySelector('.task-text').textContent;
            const priority = taskElement.getAttribute('data-priority');
            
            // Eliminar la tarea actual
            taskElement.remove();
            
            // Crear nueva tarea en la columna destino con botones actualizados
            createTaskCardWithId(taskText, targetColumn, taskId, priority);
            
            // Actualizar contadores
            updateTaskCounter(sourceColumn);
            updateTaskCounter(targetColumn);
            
            // Guardar cambios
            saveTasks();
        }

        // Función auxiliar para crear tarea con ID específico (para mantener ID al mover)
        function createTaskCardWithId(taskText, columnId, taskId, priority) {
            // Crear el elemento div para la tarjeta
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.draggable = true;
            taskCard.id = taskId;
            taskCard.setAttribute('data-priority', priority);
            
            // Agregar eventos de drag and drop
            taskCard.ondragstart = function(event) { dragStart(event, taskId); };
            taskCard.ondragend = function(event) { dragEnd(event); };
            
            // Generar botones según la nueva columna
            const actionButtons = generateActionButtons(taskId, columnId);
            
            // Obtener información de prioridad
            const priorityInfo = getPriorityInfo(priority);
            
            // Estructura HTML de la tarjeta
            taskCard.innerHTML = `
                <div class="priority-tag priority-${priority}">${priorityInfo.emoji} ${priorityInfo.text}</div>
                <div class="task-text">${taskText}</div>
                <div class="task-actions">
                    ${actionButtons}
                    <button class="task-btn delete-btn" onclick="deleteTask('${taskId}')">Delete</button>
                </div>
            `;
            
            // Agregar la tarea a la nueva columna
            document.getElementById(columnId + '-zone').appendChild(taskCard);
        }
        function drop(event, targetColumn) {
            event.preventDefault();
            
            // Remover efecto visual de drag-over
            event.currentTarget.classList.remove('drag-over');
            
            // Obtener el ID de la tarea que se está moviendo
            const taskId = event.dataTransfer.getData('text/plain');
            const taskElement = document.getElementById(taskId);
            
            if (taskElement) {
                // Obtener la columna origen antes de mover
                const sourceColumn = getTaskColumn(taskElement);
                
                // Mover la tarea a la nueva columna
                document.getElementById(targetColumn + '-zone').appendChild(taskElement);
                
                // Actualizar contadores de ambas columnas
                updateTaskCounter(sourceColumn);
                updateTaskCounter(targetColumn);
            }
        }

        // Función auxiliar para determinar en qué columna está una tarea
        function getTaskColumn(taskElement) {
            const parent = taskElement.parentElement;
            if (parent.id === 'todo-zone') return 'todo';
            if (parent.id === 'doing-zone') return 'doing';
            if (parent.id === 'done-zone') return 'done';
            return null;
        }

        // Función para eliminar una tarea
        function deleteTask(taskId) {
            const taskElement = document.getElementById(taskId);
            if (taskElement) {
                // Obtener la columna antes de eliminar para actualizar contador
                const column = getTaskColumn(taskElement);
                
                // Confirmar eliminación
                if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                    taskElement.remove();
                    updateTaskCounter(column);
                    
                    // Guardar cambios
                    saveTasks();
                }
            }
        }

        // Función para actualizar el contador de tareas en cada columna
        function updateTaskCounter(columnId) {
            if (!columnId) return;
            
            // Contar tareas en la columna especificada
            const taskCount = document.getElementById(columnId + '-zone').children.length;
            
            // Actualizar el contador visual
            document.getElementById(columnId + '-counter').textContent = taskCount;
        }

        // Remover efecto drag-over cuando el mouse sale de la zona
        document.querySelectorAll('.task-drop-zone').forEach(zone => {
            zone.addEventListener('dragleave', function(event) {
                // Solo remover si realmente salimos de la zona (no de un hijo)
                if (!this.contains(event.relatedTarget)) {
                    this.classList.remove('drag-over');
                }
            });
        });

        // Inicializar contadores y cargar tareas al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            // Cargar tareas guardadas
            loadTasks();
            
            // Inicializar contadores
            updateTaskCounter('todo');
            updateTaskCounter('doing');
            updateTaskCounter('done');
        });
 