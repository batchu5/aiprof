import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from fpdf import FPDF
except ImportError:
    install('fpdf')
    from fpdf import FPDF

def create_pdf(filename, title, content):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt=title, ln=True, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.multi_cell(0, 10, txt=content)
    pdf.output(filename)

content1 = """Machine learning is a subfield of artificial intelligence (AI). 
The goal of machine learning generally is to understand the structure of data and fit that data into models that can be understood and utilized by people.
Neural Networks are a series of algorithms that endeavor to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates.
Backpropagation is the essence of neural net training. It is the method of fine-tuning the weights of a neural net based on the error rate obtained in the previous epoch.
Vector Embeddings are high-dimensional mathematical representations used for semantic similarity.
"""
create_pdf("machine_learning_basics.pdf", "Introduction to Machine Learning", content1)

content2 = """The Roman Empire was the post-Republican period of ancient Rome. 
Julius Caesar was a Roman general and statesman who played a critical role in the events that led to the demise of the Roman Republic and the rise of the Roman Empire.
The Fall of the Western Roman Empire was the process of decline in the Western Roman Empire in which the Empire failed to enforce its rule, and its vast territory was divided into several successor polities.
"""
create_pdf("roman_empire.pdf", "History of the Roman Empire", content2)

content3 = """Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.
Quantum superposition is a fundamental principle of quantum mechanics. It states that, much like waves in classical physics, any two (or more) quantum states can be added together and the result will be another valid quantum state.
Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle of the group cannot be described independently of the state of the others.
"""
create_pdf("quantum_mechanics.pdf", "Basics of Quantum Mechanics", content3)

print("PDFs created successfully!")
