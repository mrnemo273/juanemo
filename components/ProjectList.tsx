import { projects } from '../data/projects';
import styles from './ProjectList.module.css';

export default function ProjectList() {
  if (projects.length === 0) return null;

  return (
    <section className={styles.section}>
      <ul className={styles.list}>
        {projects.map((project, index) => (
          <li key={project.name}>
            {index > 0 && <hr className={styles.separator} />}
            <article className={styles.entry}>
              <span className={styles.number}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className={styles.content}>
                <div className={styles.columns}>
                  <div>
                    <h2 className={styles.title}>{project.name}</h2>
                    <span className={styles.eyebrow}>{project.publishedDate}</span>
                  </div>
                  <div className={styles.rightCol}>
                    <p className={styles.description}>{project.description}</p>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cta}
                    >
                      View Project <span className={styles.arrow}>&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
