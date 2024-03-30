import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import moment from 'moment';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo');
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== 'undefined') {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleKeyDown = (e) => {
    const currentIndex = lists.findIndex((list) => list.id === selectListId);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      // 右矢印キーが押された場合
      newIndex = (currentIndex + 1) % lists.length;
    } else if (e.key === 'ArrowLeft') {
      // 左矢印キーが押された場合
      newIndex = (currentIndex - 1 + lists.length) % lists.length;
    }
    const newListId = lists[newIndex].id;
    handleSelectList(newListId);
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" onKeyDown={handleKeyDown}>
            {lists.map((list, index) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={list.id}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  tabIndex="0"
                  onClick={() => handleSelectList(list.id)}
                  role="button"
                  aria-pressed={isActive ? 'true' : 'false'}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>

          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  const now = moment().format();

  function getDiff(a) {
    let b = parseInt(a, 10);
    let day = 0,
      hour = 0,
      minute = 0;
    if (b >= 1440) {
      day = Math.floor(b / 1440);
      b = b % 1440;
    }
    if (b >= 60) {
      hour = Math.floor(b / 60);
      b = b % 60;
    }
    minute = b;

    return `　　残り${day > 0 ? day + '日と' : ''}${hour > 0 ? hour + '時間' : ''}${minute}分`;
  }

  if (tasks === null) return <></>;

  if (isDoneDisplay == 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                {`　　　期限：${moment(task.limit).subtract(9, 'hours').format('YYYY-MM-DD-HH-MM')}`}
                {getDiff(
                  `${moment(task.limit).subtract(9, 'hours').diff(now, 'minute')}`,
                )}
                <br />
                {task.done ? '完了' : '未完了'}
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              {`　　　期限：${moment(task.limit).subtract(9, 'hours').format('YYYY-MM-DD-HH-MM')}`}
              {getDiff(
                `${moment(task.limit).subtract(9, 'hours').diff(now, 'minute')}`,
              )}
              <br />
              {task.done ? '完了' : '未完了'}
            </Link>
          </li>
        ))}
    </ul>
  );
};
