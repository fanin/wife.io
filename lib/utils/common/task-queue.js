module.exports = TaskQueue;

function TaskQueue(taskHandler) {
    var queue = [];
    var date = new Date();

    function getTimestamp() {
        Math.round(date.getTime() / 1000);
    }

    function dequeueTask() {
        if (queue.length > 0) {
            var task = queue[0];

            if (task.status === 'WAITING') {
                task.status = 'RUNNING';
                //console.log('Running ' + task.context.data);
                if (taskHandler(task) === true) {
                    task = null;
                    task = queue.shift();
                    delete task;
                }
                else {
                    task.status = 'PENDING';
                }
            }
            else if (task.status === 'PENDING') {
                /* Wait a while and check task status again */
                //console.log('Pending ' + task.context.data);
                return;
            }
            else if (task.status === 'RUNNING') {
                /* There is a running task being interrupted, just return and let the task finish */
                return;
            }
            else {
                /* Pending task finished, remove it from queue */
                //console.log('Finish ' + task.context.data);
                task = null;
                task = queue.shift();
                delete task;
                setTimeout(dequeueTask, 1);
            }
        }
    }

    return {
        addTask: function(_context) {
            //console.log('Add ' + _context.data);
            queue.push({ tid: getTimestamp(), context: _context, status: 'WAITING' });
            setTimeout(dequeueTask, 1);
        },

        finishTask: function(task) {
            task.status = 'FINISH';
            setTimeout(dequeueTask, 1);
        },

        getCurrentTask: function() {
            if (queue.length > 0)
                return queue[0];
            else
                return null;
        },

        searchTask: function(compareFunc) {
            for (var i = 0, len = queue.length; i < len; i++) {
                if (compareFunc)
                    if (compareFunc(queue[i]))
                        return queue[i];
            }

            return null;
        },

        length: queue.length
    };
}
