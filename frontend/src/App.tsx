import { useEffect, useState } from 'react'
import './App.css'

function App() {

  const [count, setCount] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3000')
      .then(res => res.text())
      .then(data => {
        setCount(data);
        console.log(data);
      })
  }, [])

  return (
    <>
      <h1>count: {count}</h1>
     
    </>
  )
}

export default App
